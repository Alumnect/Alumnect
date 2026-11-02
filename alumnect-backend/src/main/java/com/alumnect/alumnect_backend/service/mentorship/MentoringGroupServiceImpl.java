package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringGroupRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.message.*;
import com.alumnect.alumnect_backend.entity.user.*;
import com.alumnect.alumnect_backend.exception.*;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Triển khai nghiệp vụ quản lý nhóm Mentoring theo mô hình Group-First (UC122).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentoringGroupServiceImpl implements MentoringGroupService {

    private static final Set<MentoringTaskStatus> FINISHED_TASK_STATUSES = EnumSet.of(
            MentoringTaskStatus.COMPLETED, MentoringTaskStatus.CANCELLED, MentoringTaskStatus.RESOLVED);

    private final MentoringGroupRepository groupRepository;
    private final MentoringGroupMemberRepository memberRepository;
    private final MentoringGroupMemberEventRepository eventRepository;
    private final MentoringRequestRepository requestRepository;
    private final MentoringRequestMemberRepository requestMemberRepository;
    private final MentoringTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationRepository conversationRepository;
    private final NotificationService notificationService;

    @Value("${app.mentoring.group.max-members:10}")
    private int maxMembers;

    @Override
    @Transactional
    public MentoringGroupResponse createGroup(String email, CreateMentoringGroupRequest request) {
        User leader = current(email);
        validateCanParticipateInMentoring(leader);

        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isBlank()) {
            throw new BadRequestException("Tên nhóm không được để trống");
        }

        MentoringGroup group = groupRepository.save(MentoringGroup.builder()
                .name(name)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .leader(leader)
                .status(MentoringGroupStatus.ACTIVE)
                .build());

        Instant now = Instant.now();
        MentoringGroupMember leaderMember = MentoringGroupMember.builder()
                .group(group)
                .user(leader)
                .invitedBy(leader)
                .status(MentoringGroupMemberStatus.JOINED)
                .invitedAt(now)
                .joinedAt(now)
                .build();
        memberRepository.save(leaderMember);

        audit(group, leader, leader, MentoringGroupMemberAction.ACCEPTED);
        log.info("Đã tạo nhóm Mentoring ID={} với Leader ID={}", group.getId(), leader.getId());
        return map(group, leader);
    }

    @Override
    @Transactional
    public MentoringGroupResponse updateGroup(String email, Long groupId, UpdateMentoringGroupRequest request) {
        User actor = current(email);
        MentoringGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mentoring"));

        if (!group.getLeader().getId().equals(actor.getId())) {
            throw new ForbiddenException("Chỉ trưởng nhóm mới có quyền chỉnh sửa thông tin nhóm");
        }

        boolean updated = false;
        if (request.getName() != null && !request.getName().trim().isBlank()) {
            group.setName(request.getName().trim());
            updated = true;
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
            updated = true;
        }
        if (request.getStatus() != null && request.getStatus() != group.getStatus()) {
            group.setStatus(request.getStatus());
            updated = true;
            String statusMsg = request.getStatus() == MentoringGroupStatus.CLOSED ? "đã được đóng" : "đã được mở lại";
            for (MentoringGroupMember m : memberRepository.findByGroupIdOrderByInvitedAtAsc(group.getId())) {
                if (m.getStatus().isJoined() && !m.getUser().getId().equals(actor.getId())) {
                    notificationService.sendMentoringGroupNotification(actor, m.getUser(), group,
                            request.getStatus().name(), group.getId().toString(),
                            "Thông báo nhóm mentoring", "Nhóm \"" + group.getName() + "\" " + statusMsg);
                }
            }
        }

        if (updated) {
            group = groupRepository.save(group);
        }
        return map(group, actor);
    }

    @Override
    @Transactional
    public MentoringGroup createForRequest(User leader, String title, List<Long> memberIds) {
        List<Long> ids = memberIds == null ? List.of() : memberIds;
        if (ids.isEmpty()) throw new BadRequestException("Mentoring nhóm cần ít nhất một thành viên ngoài trưởng nhóm");
        LinkedHashSet<Long> unique = new LinkedHashSet<>(ids);
        if (unique.size() != ids.size()) throw new BadRequestException("Danh sách thành viên bị trùng");
        if (unique.contains(leader.getId())) throw new BadRequestException("Trưởng nhóm không thể tự mời chính mình");
        if (unique.size() + 1 > maxMembers) throw new BadRequestException("Nhóm mentoring chỉ được tối đa " + maxMembers + " người");

        List<User> users = userRepository.findAllById(unique);
        if (users.size() != unique.size()) throw new BadRequestException("Có thành viên không tồn tại trong hệ thống");
        if (users.stream().anyMatch(u -> u.getAccountStatus() != AccountStatus.ACTIVE))
            throw new BadRequestException("Chỉ có thể mời tài khoản đang hoạt động");

        MentoringGroup group = groupRepository.save(MentoringGroup.builder()
                .name("Nhóm mentoring · " + title.trim()).leader(leader).build());
        Instant now = Instant.now();
        memberRepository.save(MentoringGroupMember.builder().group(group).user(leader).invitedBy(leader)
                .status(MentoringGroupMemberStatus.JOINED).joinedAt(now).build());
        for (User user : users) {
            MentoringGroupMember m = memberRepository.save(MentoringGroupMember.builder().group(group).user(user).invitedBy(leader)
                    .status(MentoringGroupMemberStatus.PENDING).build());
            audit(group, user, leader, MentoringGroupMemberAction.INVITED);
            notificationService.sendMentoringGroupNotification(leader, user, group, "INVITATION", m.getId().toString(),
                    "Lời mời nhóm mentoring", resolveFullName(leader) + " đã mời bạn tham gia nhóm \"" + group.getName() + "\"");
        }
        return group;
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringGroupResponse getGroup(String email, Long groupId) {
        User current = current(email);
        MentoringGroup group = requireVisible(groupId, current);
        return map(group, current);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringGroupResponse> getMyInvitations(String email) {
        User current = current(email);
        return memberRepository.findByUserIdAndStatusInOrderByInvitedAtDesc(
                current.getId(), List.of(MentoringGroupMemberStatus.PENDING, MentoringGroupMemberStatus.INVITED))
                .stream()
                .filter(m -> m.getGroup().getStatus() != MentoringGroupStatus.CANCELLED)
                .map(m -> map(m.getGroup(), current)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringGroupResponse> getMyGroups(String email) {
        return getMyGroups(email, "ALL");
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringGroupResponse> getMyGroups(String email, String filter) {
        User current = current(email);
        List<MentoringGroup> groups;
        if ("MANAGED".equalsIgnoreCase(filter)) {
            groups = groupRepository.findManagedGroups(current.getId());
        } else if ("JOINED".equalsIgnoreCase(filter)) {
            groups = groupRepository.findJoinedGroups(current.getId());
        } else {
            groups = groupRepository.findVisibleGroups(current.getId());
        }
        return groups.stream().map(g -> map(g, current)).toList();
    }

    @Override
    @Transactional
    public MentoringGroupResponse invite(String email, Long groupId, List<Long> userIds) {
        User actor = current(email);
        MentoringGroup group = requireManageable(groupId, actor);

        if (group.getStatus() != MentoringGroupStatus.ACTIVE) {
            throw new BadRequestException("Nhóm đã đóng, không thể gửi thêm lời mời");
        }

        LinkedHashSet<Long> ids = new LinkedHashSet<>(userIds == null ? List.of() : userIds);
        if (ids.isEmpty() || ids.size() != userIds.size()) {
            throw new BadRequestException("Danh sách thành viên không hợp lệ hoặc bị trùng lặp");
        }

        long occupied = memberRepository.countByGroupIdAndStatusIn(groupId,
                List.of(MentoringGroupMemberStatus.JOINED, MentoringGroupMemberStatus.ACTIVE,
                        MentoringGroupMemberStatus.PENDING, MentoringGroupMemberStatus.INVITED));
        if (occupied + ids.size() > maxMembers) {
            throw new BadRequestException("Nhóm mentoring chỉ được tối đa " + maxMembers + " người");
        }

        for (Long id : ids) {
            if (id.equals(group.getLeader().getId())) {
                throw new BadRequestException("Không thể mời trưởng nhóm");
            }
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + id));
            if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                throw new BadRequestException("Chỉ có thể mời tài khoản đang hoạt động");
            }

            MentoringGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, id).orElse(null);
            if (member != null && (member.getStatus().isJoined())) {
                throw new ConflictException("Người dùng " + resolveFullName(user) + " đã là thành viên của nhóm");
            }
            if (member != null && (member.getStatus().isPending())) {
                throw new ConflictException("Người dùng " + resolveFullName(user) + " đã có lời mời đang chờ phản hồi");
            }

            boolean reinvite = member != null;
            if (member == null) {
                member = MentoringGroupMember.builder().group(group).user(user).invitedBy(actor).build();
            }
            member.setStatus(MentoringGroupMemberStatus.PENDING);
            member.setInvitedBy(actor);
            member.setInvitedAt(Instant.now());
            member.setJoinedAt(null);
            member.setRemovedAt(null);
            MentoringGroupMember saved = memberRepository.save(member);

            audit(group, user, actor, reinvite ? MentoringGroupMemberAction.REINVITED : MentoringGroupMemberAction.INVITED);
            notificationService.sendMentoringGroupNotification(actor, user, group, "INVITATION",
                    saved.getId().toString(), "Lời mời nhóm mentoring",
                    resolveFullName(actor) + " đã mời bạn tham gia nhóm \"" + group.getName() + "\"");
        }
        return map(group, actor);
    }

    @Override
    @Transactional
    public MentoringGroupResponse accept(String email, Long groupId) {
        User user = current(email);
        MentoringGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không có lời mời vào nhóm này"));
        return doAccept(user, member);
    }

    @Override
    @Transactional
    public MentoringGroupResponse acceptInvitation(String email, Long invitationId) {
        User user = current(email);
        MentoringGroupMember member = memberRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời"));
        if (!member.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Lời mời này không thuộc về tài khoản của bạn");
        }
        return doAccept(user, member);
    }

    private MentoringGroupResponse doAccept(User user, MentoringGroupMember member) {
        MentoringGroup group = member.getGroup();
        if (group.getStatus() != MentoringGroupStatus.ACTIVE) {
            throw new BadRequestException("Nhóm mentoring này đã đóng, không thể tham gia");
        }

        if (member.getStatus().isJoined()) {
            return map(group, user);
        }
        if (!member.getStatus().isPending()) {
            throw new ConflictException("Lời mời không còn hiệu lực");
        }

        member.setStatus(MentoringGroupMemberStatus.JOINED);
        member.setJoinedAt(Instant.now());
        memberRepository.save(member);

        audit(group, user, user, MentoringGroupMemberAction.ACCEPTED);
        notificationService.sendMentoringGroupNotification(user, group.getLeader(), group,
                "ACCEPTED", member.getId().toString(),
                "Thành viên đã tham gia nhóm",
                resolveFullName(user) + " đã chấp nhận lời mời tham gia nhóm \"" + group.getName() + "\".");

        return map(group, user);
    }

    @Override
    @Transactional
    public MentoringGroupResponse decline(String email, Long groupId) {
        User user = current(email);
        MentoringGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không có lời mời vào nhóm này"));
        return doDecline(user, member);
    }

    @Override
    @Transactional
    public MentoringGroupResponse declineInvitation(String email, Long invitationId) {
        User user = current(email);
        MentoringGroupMember member = memberRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời"));
        if (!member.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Lời mời này không thuộc về tài khoản của bạn");
        }
        return doDecline(user, member);
    }

    private MentoringGroupResponse doDecline(User user, MentoringGroupMember member) {
        MentoringGroup group = member.getGroup();
        if (member.getStatus() == MentoringGroupMemberStatus.DECLINED) {
            return map(group, user);
        }
        if (!member.getStatus().isPending()) {
            throw new ConflictException("Lời mời không còn hiệu lực");
        }

        member.setStatus(MentoringGroupMemberStatus.DECLINED);
        memberRepository.save(member);

        audit(group, user, user, MentoringGroupMemberAction.DECLINED);
        notificationService.sendMentoringGroupNotification(user, group.getLeader(), group,
                "DECLINED", member.getId().toString(),
                "Thành viên từ chối lời mời",
                resolveFullName(user) + " đã từ chối lời mời tham gia nhóm \"" + group.getName() + "\".");

        return map(group, user);
    }

    @Override
    @Transactional
    public MentoringGroupResponse cancelInvitation(String email, Long groupId, Long invitationOrUserId) {
        User actor = current(email);
        MentoringGroup group = requireManageable(groupId, actor);

        MentoringGroupMember member = memberRepository.findById(invitationOrUserId)
                .filter(m -> m.getGroup().getId().equals(groupId))
                .orElseGet(() -> memberRepository.findByGroupIdAndUserId(groupId, invitationOrUserId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời cần hủy")));

        if (!member.getStatus().isPending()) {
            throw new BadRequestException("Chỉ có thể hủy lời mời đang ở trạng thái chờ phản hồi");
        }

        member.setStatus(MentoringGroupMemberStatus.CANCELLED);
        memberRepository.save(member);

        audit(group, member.getUser(), actor, MentoringGroupMemberAction.CANCELLED);
        notificationService.sendMentoringGroupNotification(actor, member.getUser(), group,
                "CANCELLED", member.getId().toString(),
                "Lời mời tham gia nhóm đã bị hủy",
                "Lời mời tham gia nhóm \"" + group.getName() + "\" của bạn đã được trưởng nhóm thu hồi.");

        return map(group, actor);
    }

    @Override
    @Transactional
    public MentoringGroupResponse remove(String email, Long groupId, Long userId) {
        User actor = current(email);
        MentoringGroup group = requireManageable(groupId, actor);

        if (group.getLeader().getId().equals(userId)) {
            throw new BadRequestException("Không thể xóa trưởng nhóm");
        }

        MentoringGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không thuộc nhóm"));

        member.setStatus(MentoringGroupMemberStatus.REMOVED);
        member.setRemovedAt(Instant.now());
        memberRepository.save(member);

        audit(group, member.getUser(), actor, MentoringGroupMemberAction.REMOVED);
        notificationService.sendMentoringGroupNotification(actor, member.getUser(), group,
                "REMOVED", member.getId().toString(),
                "Bạn đã bị xóa khỏi nhóm",
                "Bạn đã bị xóa khỏi nhóm Mentoring \"" + group.getName() + "\".");

        // Thu hồi quyền truy cập các Chat for Task (Deal và Task) của nhóm
        revokeRequestConversations(groupId, userId);

        return map(group, actor);
    }

    @Override
    @Transactional
    public MentoringGroupResponse leaveGroup(String email, Long groupId) {
        User user = current(email);
        MentoringGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mentoring"));

        if (group.getLeader().getId().equals(user.getId())) {
            throw new BadRequestException("Trưởng nhóm không thể rời nhóm khi chưa chuyển giao quyền hoặc đóng nhóm");
        }

        MentoringGroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn không phải thành viên của nhóm này"));

        if (!member.getStatus().isJoined()) {
            throw new BadRequestException("Chỉ thành viên đã tham gia mới có thể thực hiện rời nhóm");
        }

        member.setStatus(MentoringGroupMemberStatus.REMOVED);
        member.setRemovedAt(Instant.now());
        memberRepository.save(member);

        audit(group, user, user, MentoringGroupMemberAction.LEFT);
        notificationService.sendMentoringGroupNotification(user, group.getLeader(), group,
                "LEFT", member.getId().toString(),
                "Thành viên đã rời nhóm",
                resolveFullName(user) + " đã rời khỏi nhóm \"" + group.getName() + "\".");

        // Thu hồi quyền truy cập các Chat for Task (Deal và Task) của nhóm
        revokeRequestConversations(groupId, user.getId());

        return map(group, user);
    }

    @Override
    @Transactional
    public void deleteGroup(String email, Long groupId) {
        User actor = current(email);
        MentoringGroup group = groupRepository.findById(groupId)
                .filter(g -> g.getStatus() != MentoringGroupStatus.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mentoring"));
        if (!group.getLeader().getId().equals(actor.getId())) {
            throw new ForbiddenException("Chỉ trưởng nhóm mới có quyền giải tán nhóm");
        }

        List<MentoringRequest> requests = requestRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        boolean hasOpenRequest = requests.stream().anyMatch(r ->
                r.getStatus() == MentoringRequestStatus.OPEN || r.getStatus() == MentoringRequestStatus.MATCHED);
        boolean hasRunningTask = requests.stream()
                .map(r -> taskRepository.findByRequestId(r.getId()))
                .flatMap(Optional::stream)
                .anyMatch(t -> !FINISHED_TASK_STATUSES.contains(t.getStatus()));
        if (hasOpenRequest || hasRunningTask) {
            throw new ConflictException("Nhóm đang có yêu cầu hoặc nhiệm vụ mentoring chưa kết thúc. "
                    + "Hãy hủy yêu cầu hoặc hoàn tất nhiệm vụ trước khi giải tán nhóm.");
        }

        group.setStatus(MentoringGroupStatus.CANCELLED);
        groupRepository.save(group);

        Instant now = Instant.now();
        for (MentoringGroupMember member : memberRepository.findByGroupIdOrderByInvitedAtAsc(groupId)) {
            if (member.getUser().getId().equals(actor.getId())) continue;
            boolean pending = member.getStatus().isPending();
            if (!pending && !member.getStatus().isJoined()) continue;
            if (pending) {
                member.setStatus(MentoringGroupMemberStatus.CANCELLED);
                member.setRemovedAt(now);
                memberRepository.save(member);
                audit(group, member.getUser(), actor, MentoringGroupMemberAction.CANCELLED);
            }
            notificationService.sendMentoringGroupNotification(actor, member.getUser(), group,
                    "DISBANDED", group.getId().toString(), "Nhóm mentoring đã giải tán",
                    "Nhóm \"" + group.getName() + "\" đã được trưởng nhóm giải tán.");
        }
        log.info("Trưởng nhóm userId={} đã giải tán nhóm Mentoring ID={}", actor.getId(), groupId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringGroupRequestSummaryResponse> getGroupRequests(String email, Long groupId) {
        User current = current(email);
        MentoringGroup group = requireVisible(groupId, current);
        List<MentoringRequest> requests = requestRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());
        return requests.stream().map(this::mapRequestSummary).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isActiveMember(MentoringRequest request, Long userId) {
        if (request == null) return false;
        if (request.getStudent() != null && request.getStudent().getId().equals(userId)) return true;
        boolean inSnapshot = requestMemberRepository.existsByRequestIdAndUserId(request.getId(), userId);
        if (request.getGroup() == null) return inSnapshot;
        boolean stillJoined = isJoinedMember(request.getGroup().getId(), userId);
        // Request đã chốt snapshot: chỉ thành viên trong snapshot và vẫn còn trong nhóm mới có quyền
        return requestMemberRepository.existsByRequestId(request.getId()) ? inSnapshot && stillJoined : stillJoined;
    }

    @Override
    @Transactional
    public void synchronizeConversationParticipants(MentoringRequest request, Conversation conversation) {
        if (request == null || conversation == null || request.getGroup() == null) return;
        Long groupId = request.getGroup().getId();

        // Ưu tiên snapshot thành viên tại thời điểm gửi Request; request cũ chưa có snapshot thì lấy thành viên JOINED
        List<User> members = requestMemberRepository.existsByRequestId(request.getId())
                ? requestMemberRepository.findByRequestId(request.getId()).stream()
                        .map(MentoringRequestMember::getUser)
                        .filter(u -> isJoinedMember(groupId, u.getId()))
                        .toList()
                : memberRepository.findByGroupIdOrderByInvitedAtAsc(groupId).stream()
                        .filter(m -> m.getStatus().isJoined())
                        .map(MentoringGroupMember::getUser)
                        .toList();

        User mentor = conversation.getMentoringMentor();
        for (User member : members) {
            if (member.getId().equals(request.getStudent().getId())
                    || (mentor != null && member.getId().equals(mentor.getId()))
                    || participantRepository.existsByConversationIdAndUserId(conversation.getId(), member.getId())) {
                continue;
            }
            participantRepository.save(ConversationParticipant.builder()
                    .conversation(conversation)
                    .user(member)
                    .role(ParticipantRole.MEMBER)
                    .isAccepted(true)
                    .joinedAt(Instant.now())
                    .build());

            if (conversation.getMentoringTask() != null) {
                notificationService.sendMentoringTaskEventNotification(request.getStudent(), member,
                        conversation.getMentoringTask(), "GROUP_TASK_ACTIVATED", "GROUP:" + request.getId(),
                        "Nhóm mentoring đã bắt đầu", "Task đã được kích hoạt. Bạn có thể xem tiến độ và nhắn tin trong nhóm.");
            } else {
                notificationService.sendMentoringGroupNotification(mentor != null ? mentor : request.getStudent(), member,
                        request.getGroup(), "REQUEST_CHAT", conversation.getId().toString(),
                        "Mentor đã phản hồi yêu cầu của nhóm",
                        resolveFullName(mentor) + " đã mở trao đổi về yêu cầu \"" + request.getTitle()
                                + "\". Bạn có thể cùng nhóm thảo luận Deal với Mentor.");
            }
        }
    }

    private boolean isJoinedMember(Long groupId, Long userId) {
        return memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getStatus().isJoined())
                .orElse(false);
    }

    /** Thu hồi quyền vào mọi Chat for Task (Deal và Task) thuộc các Request của nhóm. */
    private void revokeRequestConversations(Long groupId, Long userId) {
        for (MentoringRequest request : requestRepository.findByGroupIdOrderByCreatedAtDesc(groupId)) {
            if (request.getStudent().getId().equals(userId)) continue;
            for (Conversation conversation : conversationRepository.findByMentoringRequestIdOrderByCreatedAtAsc(request.getId())) {
                if (conversation.getMentoringMentor() != null && conversation.getMentoringMentor().getId().equals(userId)) continue;
                participantRepository.deleteByConversationIdAndUserId(conversation.getId(), userId);
            }
        }
    }

    private User current(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private void validateCanParticipateInMentoring(User user) {
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa kích hoạt");
        }
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        if (!"STUDENT".equalsIgnoreCase(roleName) && !"ALUMNI".equalsIgnoreCase(roleName) && !"ADMIN".equalsIgnoreCase(roleName)) {
            throw new ForbiddenException("Chỉ sinh viên hoặc cựu sinh viên mới có quyền tạo nhóm Mentoring");
        }
    }

    private MentoringGroup requireVisible(Long id, User user) {
        MentoringGroup group = groupRepository.findById(id)
                .filter(g -> g.getStatus() != MentoringGroupStatus.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mentoring"));
        if (!canManage(group, user) && memberRepository.findByGroupIdAndUserId(id, user.getId()).isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền xem nhóm này");
        }
        return group;
    }

    private MentoringGroup requireManageable(Long id, User user) {
        MentoringGroup group = groupRepository.findById(id)
                .filter(g -> g.getStatus() != MentoringGroupStatus.CANCELLED)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm mentoring"));
        if (!canManage(group, user)) {
            throw new ForbiddenException("Chỉ trưởng nhóm hoặc Mentor của Task được quản lý thành viên");
        }
        return group;
    }

    private boolean canManage(MentoringGroup group, User user) {
        if (group.getLeader().getId().equals(user.getId())) return true;
        return requestRepository.findByGroupIdOrderByCreatedAtDesc(group.getId()).stream()
                .map(r -> taskRepository.findByRequestId(r.getId()))
                .filter(Optional::isPresent).map(Optional::get)
                .anyMatch(t -> t.getMentor().getId().equals(user.getId()));
    }

    private void audit(MentoringGroup group, User member, User actor, MentoringGroupMemberAction action) {
        eventRepository.save(MentoringGroupMemberEvent.builder()
                .group(group).member(member).actor(actor).action(action).build());
    }

    private String resolveFullName(User user) {
        if (user == null) return "Người dùng AlumNect";
        UserProfile p = user.getProfile() != null ? user.getProfile() : profileRepository.findById(user.getId()).orElse(null);
        return p != null && p.getFullName() != null && !p.getFullName().isBlank() ? p.getFullName() : user.getEmail();
    }

    private MentoringGroupRequestSummaryResponse mapRequestSummary(MentoringRequest r) {
        String targetMentorName = null;
        if (r.getTargetMentor() != null && r.getTargetMentor().getUser() != null) {
            targetMentorName = resolveFullName(r.getTargetMentor().getUser());
        }
        Long taskId = taskRepository.findByRequestId(r.getId()).map(MentoringTask::getId).orElse(null);
        return MentoringGroupRequestSummaryResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .requestType(r.getRequestType())
                .status(r.getStatus())
                .targetMentorId(r.getTargetMentor() != null ? r.getTargetMentor().getId() : null)
                .targetMentorName(targetMentorName)
                .confirmedDealId(r.getConfirmedDeal() != null ? r.getConfirmedDeal().getId() : null)
                .taskId(taskId)
                .createdAt(r.getCreatedAt())
                .build();
    }

    private MentoringGroupResponse map(MentoringGroup group, User current) {
        List<MentoringRequest> requests = requestRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());
        Long latestRequestId = !requests.isEmpty() ? requests.get(0).getId() : null;

        List<MentoringGroupMember> rawMembers = memberRepository.findByGroupIdOrderByInvitedAtAsc(group.getId());

        int joinedCount = (int) rawMembers.stream().filter(m -> m.getStatus().isJoined()).count();
        int pendingCount = (int) rawMembers.stream().filter(m -> m.getStatus().isPending()).count();

        boolean canManageGroup = canManage(group, current);

        List<MentoringGroupMemberResponse> memberResponses = rawMembers.stream().map(m -> {
            UserProfile p = profileRepository.findById(m.getUser().getId()).orElse(null);
            String majorName = p != null && p.getMajor() != null ? p.getMajor().getName() : null;
            String roleName = m.getUser().getRole() != null ? m.getUser().getRole().getName() : null;
            return MentoringGroupMemberResponse.builder()
                    .id(m.getId())
                    .groupId(group.getId())
                    .userId(m.getUser().getId())
                    .fullName(p != null ? p.getFullName() : m.getUser().getEmail())
                    .email(m.getUser().getEmail())
                    .avatarUrl(p != null ? p.getAvatarUrl() : null)
                    .major(majorName)
                    .role(roleName)
                    .leader(m.getUser().getId().equals(group.getLeader().getId()))
                    .status(m.getStatus())
                    .invitedAt(m.getInvitedAt())
                    .joinedAt(m.getJoinedAt())
                    .removedAt(m.getRemovedAt())
                    .build();
        }).toList();

        UserProfile leaderProfile = profileRepository.findById(group.getLeader().getId()).orElse(null);
        String leaderName = leaderProfile != null ? leaderProfile.getFullName() : group.getLeader().getEmail();
        String leaderAvatar = leaderProfile != null ? leaderProfile.getAvatarUrl() : null;

        return MentoringGroupResponse.builder()
                .id(group.getId())
                .requestId(latestRequestId)
                .name(group.getName())
                .description(group.getDescription())
                .status(group.getStatus())
                .leaderId(group.getLeader().getId())
                .leaderName(leaderName)
                .leaderAvatarUrl(leaderAvatar)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .maxMembers(maxMembers)
                .joinedMemberCount(joinedCount)
                .pendingMemberCount(pendingCount)
                .canManage(canManageGroup)
                .members(memberResponses)
                .requests(requests.stream().map(this::mapRequestSummary).toList())
                .build();
    }
}
