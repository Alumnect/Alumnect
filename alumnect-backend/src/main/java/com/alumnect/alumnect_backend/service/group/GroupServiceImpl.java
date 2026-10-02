package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.GroupCategories;
import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.JoinRequestAction;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import com.alumnect.alumnect_backend.dao.group.CommunityGroupRepository;
import com.alumnect.alumnect_backend.dao.group.GroupMemberRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupActionResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupCardResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupDetailResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMemberResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupMembershipResponse;
import com.alumnect.alumnect_backend.dto.response.group.JoinRequestResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.mapper.group.GroupMapper;
import com.alumnect.alumnect_backend.specification.group.GroupSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Triển khai nghiệp vụ Hội nhóm cộng đồng.
 * <ul>
 *   <li>Mỗi người dùng chỉ có 1 dòng group_members trên mỗi nhóm; mọi chuyển trạng thái chỉ đổi dòng đó.</li>
 *   <li>memberCount chỉ đổi qua query {@code @Modifying} khi trạng thái đi vào/ra ACTIVE; giá trị trả về cho Client
 *       được tính ở biến cục bộ, không gọi setter trên entity đang managed (tránh Hibernate flush thêm UPDATE).</li>
 *   <li>Vai trò/trạng thái thành viên luôn do Service gán, không nhận từ Client (BR-09).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupServiceImpl implements GroupService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_TOPIC_LENGTH = 50;

    private final CommunityGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository conversationParticipantRepository;
    private final MessageRepository messageRepository;
    private final GroupMapper groupMapper;

    // ==================== Xem danh sách / chi tiết ====================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupCardResponse> listGroups(String email, String keyword, String category, int page, int size) {
        String normalizedCategory = category == null ? null : category.trim();
        if (normalizedCategory != null && !normalizedCategory.isEmpty() && !GroupCategories.isValid(normalizedCategory)) {
            throw new BadRequestException("Danh mục hội nhóm không hợp lệ.");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), sanitizeSize(size),
                Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<CommunityGroup> result = groupRepository.findAll(GroupSpecification.discover(keyword, normalizedCategory), pageable);

        User viewer = findUserOrNull(email);
        Map<Long, GroupMember> viewerMemberships = Map.of();
        if (viewer != null && !result.isEmpty()) {
            List<Long> groupIds = result.getContent().stream().map(CommunityGroup::getId).toList();
            viewerMemberships = memberRepository.findByUserIdAndGroupIdIn(viewer.getId(), groupIds).stream()
                    .collect(Collectors.toMap(m -> m.getGroup().getId(), Function.identity()));
        }

        Map<Long, GroupMember> finalMemberships = viewerMemberships;
        return toPageResponse(result, group -> groupMapper.toCard(group, finalMemberships.get(group.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupCardResponse> getMyGroups(String email, int page, int size) {
        User user = requireUser(email);
        Pageable pageable = PageRequest.of(Math.max(0, page), sanitizeSize(size));
        Page<GroupMember> result = memberRepository.findMyGroups(user.getId(), pageable);
        return toPageResponse(result, member -> groupMapper.toCard(member.getGroup(), member));
    }

    @Override
    @Transactional(readOnly = true)
    public GroupDetailResponse getGroupDetail(Long groupId, String email) {
        CommunityGroup group = getVisibleGroup(groupId);
        User viewer = findUserOrNull(email);
        GroupMember viewerMembership = viewer == null ? null : memberRepository.findByGroupIdAndUserId(groupId, viewer.getId()).orElse(null);
        return buildDetail(group, viewerMembership);
    }

    // ==================== Tạo / sửa / đóng / xóa ====================

    @Override
    @Transactional
    public GroupDetailResponse createGroup(String email, CreateGroupRequest request) {
        User user = requireMemberUser(email, "Chỉ sinh viên và cựu sinh viên mới được tạo hội nhóm.");
        NormalizedInput input = normalizeInput(request.getName(), request.getDescription(), request.getCoverImageUrl(),
                request.getCategory(), request.getTopics(), request.getJoinRules());

        CommunityGroup group = groupRepository.save(CommunityGroup.builder()
                .name(input.name())
                .description(input.description())
                .coverImageUrl(input.coverImageUrl())
                .category(input.category())
                .topics(input.topics())
                .privacy(request.getPrivacy())
                .joinRules(input.joinRules())
                .owner(user)
                .memberCount(1)
                .status(GroupStatus.ACTIVE)
                .build());

        GroupMember ownerMembership = memberRepository.save(GroupMember.builder()
                .group(group)
                .user(user)
                .role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(Instant.now())
                .build());

        log.info("Người dùng {} đã tạo hội nhóm id={}", email, group.getId());
        return buildDetail(group, ownerMembership);
    }

    @Override
    @Transactional
    public GroupDetailResponse updateGroup(Long groupId, String email, UpdateGroupRequest request) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        GroupMember actor = requireManager(group, user);
        assertGroupActive(group);

        NormalizedInput input = normalizeInput(request.getName(), request.getDescription(), request.getCoverImageUrl(),
                request.getCategory(), request.getTopics(), request.getJoinRules());
        group.setName(input.name());
        group.setDescription(input.description());
        group.setCoverImageUrl(input.coverImageUrl());
        group.setCategory(input.category());
        group.setTopics(input.topics());
        group.setPrivacy(request.getPrivacy());
        group.setJoinRules(input.joinRules());
        groupRepository.save(group);

        log.info("Người dùng {} đã cập nhật hội nhóm id={}", email, groupId);
        return buildDetail(group, actor);
    }

    @Override
    @Transactional
    public GroupActionResponse updateGroupStatus(Long groupId, String email, GroupStatus status) {
        if (status != GroupStatus.ACTIVE && status != GroupStatus.INACTIVE) {
            throw new BadRequestException("Chỉ được đóng (INACTIVE) hoặc mở lại (ACTIVE) hội nhóm. Để xóa hãy dùng chức năng xóa hội nhóm.");
        }
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        requireOwner(group, user);

        if (group.getStatus() != status) {
            group.setStatus(status);
            groupRepository.save(group);
        }
        log.info("Owner {} đổi trạng thái hội nhóm id={} sang {}", email, groupId, status);
        return GroupActionResponse.builder()
                .groupId(groupId)
                .status(status.name())
                .memberCount(group.getMemberCount())
                .message(status == GroupStatus.INACTIVE ? "Đã đóng hội nhóm." : "Đã mở lại hội nhóm.")
                .build();
    }

    @Override
    @Transactional
    public GroupActionResponse deleteGroup(Long groupId, String email) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        requireOwner(group, user);

        group.setStatus(GroupStatus.DELETED);
        groupRepository.save(group);
        log.info("Owner {} đã xóa hội nhóm id={}", email, groupId);
        return GroupActionResponse.builder()
                .groupId(groupId)
                .status(GroupStatus.DELETED.name())
                .memberCount(group.getMemberCount())
                .message("Đã xóa hội nhóm.")
                .build();
    }

    // ==================== Tham gia / rời nhóm ====================

    @Override
    @Transactional
    public GroupMembershipResponse joinGroup(Long groupId, String email) {
        User user = requireMemberUser(email, "Chỉ sinh viên và cựu sinh viên mới được tham gia hội nhóm.");
        CommunityGroup group = getVisibleGroup(groupId);
        assertGroupActive(group);

        boolean isPublic = group.getPrivacy() == GroupPrivacy.PUBLIC;
        GroupMember membership = memberRepository.findByGroupIdAndUserIdForUpdate(groupId, user.getId()).orElse(null);

        if (membership != null) {
            if (membership.getMembershipStatus() == MembershipStatus.ACTIVE) {
                throw new ConflictException("Bạn đã là thành viên của hội nhóm này.");
            }
            if (membership.getMembershipStatus() == MembershipStatus.PENDING) {
                throw new ConflictException("Bạn đã gửi yêu cầu tham gia, vui lòng chờ Owner/Admin duyệt.");
            }
            // REJECTED / LEFT / REMOVED: dùng lại đúng dòng cũ, đưa về MEMBER như một lần tham gia mới.
            membership.setRole(MembershipRole.MEMBER);
            applyJoinState(membership, isPublic);
            memberRepository.save(membership);
        } else {
            membership = GroupMember.builder()
                    .group(group)
                    .user(user)
                    .role(MembershipRole.MEMBER)
                    .build();
            applyJoinState(membership, isPublic);
            try {
                memberRepository.saveAndFlush(membership);
            } catch (DataIntegrityViolationException ex) {
                // Hai request đồng thời cùng tạo dòng — UNIQUE (group_id, user_id) chặn request đến sau (BR-03, BR-14).
                throw new ConflictException("Yêu cầu tham gia đang được xử lý, vui lòng không gửi trùng lặp.");
            }
        }

        int memberCount = group.getMemberCount();
        if (isPublic) {
            groupRepository.incrementMemberCount(groupId);
            memberCount++;
        }
        log.info("Người dùng {} {} hội nhóm id={}", email, isPublic ? "đã tham gia" : "đã gửi yêu cầu tham gia", groupId);

        return GroupMembershipResponse.builder()
                .groupId(groupId)
                .viewerMembershipStatus(membership.getMembershipStatus().name())
                .viewerRole(groupMapper.viewerRole(membership))
                .memberCount(memberCount)
                .message(isPublic ? "Tham gia hội nhóm thành công!" : "Đã gửi yêu cầu tham gia, vui lòng chờ duyệt.")
                .build();
    }

    @Override
    @Transactional
    public GroupMembershipResponse leaveGroup(Long groupId, String email, Long transferToUserId) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        GroupMember membership = memberRepository.findByGroupIdAndUserIdForUpdate(groupId, user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn chưa tham gia hoặc chưa gửi yêu cầu tham gia hội nhóm này."));

        // Hủy yêu cầu đang chờ duyệt: chưa phải thành viên nên không đổi memberCount.
        if (membership.getMembershipStatus() == MembershipStatus.PENDING) {
            membership.setMembershipStatus(MembershipStatus.LEFT);
            memberRepository.save(membership);
            log.info("Người dùng {} đã hủy yêu cầu tham gia hội nhóm id={}", email, groupId);
            return GroupMembershipResponse.builder()
                    .groupId(groupId)
                    .viewerMembershipStatus(MembershipStatus.LEFT.name())
                    .memberCount(group.getMemberCount())
                    .message("Đã hủy yêu cầu tham gia.")
                    .build();
        }
        if (membership.getMembershipStatus() != MembershipStatus.ACTIVE) {
            throw new BadRequestException("Bạn không phải là thành viên của hội nhóm này.");
        }

        String message = "Đã rời khỏi hội nhóm.";
        if (membership.getRole() == MembershipRole.OWNER) {
            long activeMembers = memberRepository.countByGroupIdAndMembershipStatus(groupId, MembershipStatus.ACTIVE);
            if (activeMembers <= 1) {
                // Owner là người cuối cùng: rời đi thì nhóm không còn ai, chuyển sang DELETED để luôn không có nhóm mồ côi (BR-02).
                group.setStatus(GroupStatus.DELETED);
                groupRepository.save(group);
                message = "Bạn là thành viên cuối cùng nên hội nhóm đã được xóa.";
            } else {
                if (transferToUserId == null) {
                    throw new BadRequestException("Bạn là chủ sở hữu, hãy chuyển quyền sở hữu cho một thành viên khác trước khi rời nhóm.");
                }
                if (transferToUserId.equals(user.getId())) {
                    throw new BadRequestException("Không thể chuyển quyền sở hữu cho chính mình.");
                }
                GroupMember successor = memberRepository.findByGroupIdAndUserIdForUpdate(groupId, transferToUserId)
                        .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                        .orElseThrow(() -> new BadRequestException("Người nhận quyền sở hữu phải là thành viên đang hoạt động của nhóm."));
                // Giải phóng slot OWNER trước khi bổ nhiệm người kế nhiệm (unique index không deferrable).
                membership.setRole(MembershipRole.MEMBER);
                memberRepository.saveAndFlush(membership);
                successor.setRole(MembershipRole.OWNER);
                memberRepository.save(successor);
                group.setOwner(successor.getUser());
                groupRepository.save(group);
                message = "Đã chuyển quyền sở hữu và rời khỏi hội nhóm.";

                // Tự động chuyển quyền Trưởng nhóm chat sang cho Chủ sở hữu mới nếu hội nhóm đã có nhóm chat
                conversationRepository.findByCommunityGroupId(groupId).ifPresent(conv -> {
                    conv.setCreatedBy(successor.getUser());
                    conversationRepository.save(conv);
                    conversationParticipantRepository.findByConversationIdAndUserId(conv.getId(), successor.getUser().getId())
                            .ifPresent(p -> {
                                p.setRole(ParticipantRole.ADMIN);
                                conversationParticipantRepository.save(p);
                            });
                    log.info("Đã chuyển quyền Trưởng nhóm chat id={} sang cho Chủ sở hữu mới userId={}", conv.getId(), successor.getUser().getId());
                });
            }
        }

        membership.setMembershipStatus(MembershipStatus.LEFT);
        membership.setRole(MembershipRole.MEMBER);
        memberRepository.save(membership);
        groupRepository.decrementMemberCount(groupId);
        log.info("Người dùng {} đã rời hội nhóm id={}", email, groupId);

        // Xóa thành viên khỏi nhóm chat của hội nhóm nếu có
        conversationRepository.findByCommunityGroupId(groupId).ifPresent(conv -> {
            if (conversationParticipantRepository.existsByConversationIdAndUserId(conv.getId(), user.getId())) {
                conversationParticipantRepository.deleteByConversationIdAndUserId(conv.getId(), user.getId());
                log.info("Đã xóa người dùng {} khỏi nhóm chat id={} khi rời hội nhóm id={}", email, conv.getId(), groupId);
            }
        });

        return GroupMembershipResponse.builder()
                .groupId(groupId)
                .viewerMembershipStatus(MembershipStatus.LEFT.name())
                .memberCount(Math.max(0, group.getMemberCount() - 1))
                .message(message)
                .build();
    }

    // ==================== Thành viên / yêu cầu tham gia ====================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupMemberResponse> getMembers(Long groupId, String email, String keyword, int page, int size) {
        CommunityGroup group = getVisibleGroup(groupId);
        if (group.getPrivacy() == GroupPrivacy.PRIVATE) {
            User viewer = findUserOrNull(email);
            boolean isActiveMember = viewer != null && memberRepository.findByGroupIdAndUserId(groupId, viewer.getId())
                    .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE).isPresent();
            if (!isActiveMember) {
                throw new ForbiddenException("Chỉ thành viên mới xem được danh sách thành viên của hội nhóm riêng tư.");
            }
        }

        String raw = keyword == null ? "" : keyword.trim().toLowerCase();
        String likeRaw = raw.isEmpty() ? "" : "%" + raw + "%";
        String likeUnaccented = raw.isEmpty() ? "" : "%" + VietnameseStringUtils.removeAccents(raw) + "%";

        Pageable pageable = PageRequest.of(Math.max(0, page), sanitizeSize(size));
        Page<GroupMember> result = memberRepository.searchActiveMembers(groupId, likeRaw, likeUnaccented, pageable);
        Map<Long, UserProfile> profiles = loadProfiles(result.getContent().stream().map(m -> m.getUser().getId()).toList());
        return toPageResponse(result, m -> groupMapper.toMember(m, profiles.get(m.getUser().getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<JoinRequestResponse> getJoinRequests(Long groupId, String email, int page, int size) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        requireManager(group, user);

        Pageable pageable = PageRequest.of(Math.max(0, page), sanitizeSize(size));
        Page<GroupMember> result = memberRepository.findPendingRequests(groupId, pageable);
        Map<Long, UserProfile> profiles = loadProfiles(result.getContent().stream().map(m -> m.getUser().getId()).toList());
        return toPageResponse(result, m -> groupMapper.toJoinRequest(m, profiles.get(m.getUser().getId())));
    }

    @Override
    @Transactional
    public GroupActionResponse handleJoinRequest(Long groupId, Long requestId, String email, JoinRequestAction action) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        requireManager(group, user);

        GroupMember request = memberRepository.findByIdAndGroupIdForUpdate(requestId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu tham gia."));
        // Khóa dòng + kiểm tra PENDING: một yêu cầu chỉ được xử lý đúng 1 lần dù nhận nhiều request đồng thời.
        if (request.getMembershipStatus() != MembershipStatus.PENDING) {
            throw new ConflictException("Yêu cầu này đã được xử lý trước đó.");
        }

        int memberCount = group.getMemberCount();
        if (action == JoinRequestAction.APPROVE) {
            assertGroupActive(group);
            request.setMembershipStatus(MembershipStatus.ACTIVE);
            request.setRole(MembershipRole.MEMBER);
            request.setJoinedAt(Instant.now());
            memberRepository.save(request);
            groupRepository.incrementMemberCount(groupId);
            memberCount++;
        } else {
            request.setMembershipStatus(MembershipStatus.REJECTED);
            memberRepository.save(request);
        }
        log.info("{} đã {} yêu cầu id={} của hội nhóm id={}", email, action, requestId, groupId);

        return GroupActionResponse.builder()
                .groupId(groupId)
                .targetUserId(request.getUser().getId())
                .status(request.getMembershipStatus().name())
                .memberCount(memberCount)
                .message(action == JoinRequestAction.APPROVE ? "Đã chấp nhận yêu cầu tham gia." : "Đã từ chối yêu cầu tham gia.")
                .build();
    }

    @Override
    @Transactional
    public GroupActionResponse removeMember(Long groupId, Long targetUserId, String email) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        GroupMember actor = requireManager(group, user);

        if (targetUserId.equals(user.getId())) {
            throw new BadRequestException("Bạn không thể tự xóa mình khỏi nhóm. Hãy dùng chức năng rời nhóm.");
        }
        GroupMember target = memberRepository.findByGroupIdAndUserIdForUpdate(groupId, targetUserId)
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên trong hội nhóm."));

        if (target.getRole() == MembershipRole.OWNER) {
            throw new ForbiddenException("Không thể xóa chủ sở hữu khỏi hội nhóm.");
        }
        if (actor.getRole() == MembershipRole.ADMIN && target.getRole() != MembershipRole.MEMBER) {
            throw new ForbiddenException("Quản trị viên chỉ được xóa thành viên thông thường.");
        }

        target.setMembershipStatus(MembershipStatus.REMOVED);
        target.setRole(MembershipRole.MEMBER);
        memberRepository.save(target);
        groupRepository.decrementMemberCount(groupId);
        log.info("{} đã xóa thành viên userId={} khỏi hội nhóm id={}", email, targetUserId, groupId);

        // Xóa thành viên khỏi nhóm chat của hội nhóm nếu có
        conversationRepository.findByCommunityGroupId(groupId).ifPresent(conv -> {
            if (conversationParticipantRepository.existsByConversationIdAndUserId(conv.getId(), targetUserId)) {
                conversationParticipantRepository.deleteByConversationIdAndUserId(conv.getId(), targetUserId);
                log.info("Đã xóa userId={} khỏi nhóm chat id={} khi bị xóa khỏi hội nhóm id={}", targetUserId, conv.getId(), groupId);
            }
        });

        return GroupActionResponse.builder()
                .groupId(groupId)
                .targetUserId(targetUserId)
                .status(MembershipStatus.REMOVED.name())
                .memberCount(Math.max(0, group.getMemberCount() - 1))
                .message("Đã xóa thành viên khỏi hội nhóm.")
                .build();
    }

    @Override
    @Transactional
    public GroupActionResponse changeMemberRole(Long groupId, Long targetUserId, String email, MembershipRole newRole) {
        if (newRole != MembershipRole.ADMIN && newRole != MembershipRole.MEMBER) {
            throw new BadRequestException("Chỉ được phân quyền quản trị viên (ADMIN) hoặc thu hồi về thành viên (MEMBER).");
        }
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        requireOwner(group, user);

        if (targetUserId.equals(user.getId())) {
            throw new BadRequestException("Bạn không thể thay đổi vai trò của chính mình.");
        }
        GroupMember target = memberRepository.findByGroupIdAndUserIdForUpdate(groupId, targetUserId)
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên trong hội nhóm."));
        if (target.getRole() == MembershipRole.OWNER) {
            throw new BadRequestException("Không thể thay đổi vai trò của chủ sở hữu.");
        }

        if (newRole == MembershipRole.ADMIN && target.getRole() != MembershipRole.ADMIN
                && memberRepository.countByGroupIdAndRoleAndMembershipStatus(
                        groupId, MembershipRole.ADMIN, MembershipStatus.ACTIVE) > 0) {
            throw new BadRequestException("Mỗi hội nhóm chỉ được có một quản trị viên. Hãy gỡ Admin hiện tại trước.");
        }

        target.setRole(newRole);
        memberRepository.save(target);
        log.info("Owner {} đổi vai trò userId={} thành {} ở hội nhóm id={}", email, targetUserId, newRole, groupId);

        return GroupActionResponse.builder()
                .groupId(groupId)
                .targetUserId(targetUserId)
                .status(newRole.name())
                .memberCount(group.getMemberCount())
                .message(newRole == MembershipRole.ADMIN ? "Đã phân quyền quản trị viên." : "Đã thu hồi quyền quản trị viên.")
                .build();
    }

    @Override
    @Transactional
    public Long createGroupChat(Long groupId, String email) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        assertGroupActive(group);
        requireOwner(group, user);

        var existingOpt = conversationRepository.findByCommunityGroupId(groupId);
        if (existingOpt.isPresent()) {
            return existingOpt.get().getId();
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .title(group.getName())
                .avatarUrl(group.getCoverImageUrl())
                .createdBy(user)
                .communityGroup(group)
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();

        Conversation savedConversation = conversationRepository.save(conversation);

        // Chủ sở hữu hội nhóm là ADMIN (trưởng nhóm) của cuộc trò chuyện
        ConversationParticipant participant = ConversationParticipant.builder()
                .conversation(savedConversation)
                .user(user)
                .role(ParticipantRole.ADMIN)
                .isAccepted(true)
                .joinedAt(Instant.now())
                .build();
        conversationParticipantRepository.save(participant);

        // Tạo tin nhắn hệ thống chào mừng nhóm
        UserProfile userProfile = userProfileRepository.findById(user.getId()).orElse(null);
        String userName = userProfile != null && userProfile.getFullName() != null
                ? userProfile.getFullName()
                : user.getEmail();

        Message initMessage = messageRepository.save(Message.builder()
                .conversation(savedConversation)
                .sender(user)
                .type(MessageType.SYSTEM)
                .content(userName + " đã khởi tạo nhóm trò chuyện cho hội nhóm \"" + group.getName() + "\"")
                .createdAt(Instant.now())
                .build());

        savedConversation.setLastMessageAt(initMessage.getCreatedAt());
        conversationRepository.save(savedConversation);

        log.info("Owner {} đã khởi tạo nhóm chat id={} cho hội nhóm id={}", email, savedConversation.getId(), groupId);
        return savedConversation.getId();
    }

    @Override
    @Transactional
    public Long joinGroupChat(Long groupId, String email) {
        User user = requireUser(email);
        CommunityGroup group = getVisibleGroup(groupId);
        assertGroupActive(group);

        GroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Bạn phải là thành viên chính thức của hội nhóm để tham gia nhóm trò chuyện."));

        Conversation conversation = conversationRepository.findByCommunityGroupId(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Hội nhóm chưa khởi tạo nhóm trò chuyện."));

        boolean alreadyParticipant = conversationParticipantRepository
                .existsByConversationIdAndUserId(conversation.getId(), user.getId());

        if (!alreadyParticipant) {
            // Chỉ Chủ sở hữu hội nhóm mới là ADMIN của nhóm chat, Quản trị viên hay thành viên đều là MEMBER
            ParticipantRole chatRole = (membership.getRole() == MembershipRole.OWNER)
                    ? ParticipantRole.ADMIN
                    : ParticipantRole.MEMBER;

            ConversationParticipant participant = ConversationParticipant.builder()
                    .conversation(conversation)
                    .user(user)
                    .role(chatRole)
                    .isAccepted(true)
                    .joinedAt(Instant.now())
                    .build();
            conversationParticipantRepository.save(participant);

            // Tin nhắn hệ thống khi thành viên mới tham gia
            UserProfile userProfile = userProfileRepository.findById(user.getId()).orElse(null);
            String userName = userProfile != null && userProfile.getFullName() != null
                    ? userProfile.getFullName()
                    : user.getEmail();

            Message joinMessage = messageRepository.save(Message.builder()
                    .conversation(conversation)
                    .sender(user)
                    .type(MessageType.SYSTEM)
                    .content(userName + " đã tham gia nhóm trò chuyện.")
                    .createdAt(Instant.now())
                    .build());

            conversation.setLastMessageAt(joinMessage.getCreatedAt());
            conversationRepository.save(conversation);
            log.info("Người dùng {} đã tham gia nhóm chat id={} của hội nhóm id={}", email, conversation.getId(), groupId);
        }

        return conversation.getId();
    }

    // ==================== Hàm hỗ trợ ====================

    private GroupDetailResponse buildDetail(CommunityGroup group, GroupMember viewerMembership) {
        boolean activeMember = viewerMembership != null && viewerMembership.getMembershipStatus() == MembershipStatus.ACTIVE;
        // BR-13: nhóm riêng tư chỉ lộ thông tin người sáng lập và danh sách thành viên cho thành viên ACTIVE.
        boolean canSeeInside = group.getPrivacy() == GroupPrivacy.PUBLIC || activeMember;
        UserProfile ownerProfile = canSeeInside ? userProfileRepository.findById(group.getOwner().getId()).orElse(null) : null;
        Long pendingCount = isManager(viewerMembership)
                ? memberRepository.countByGroupIdAndMembershipStatus(group.getId(), MembershipStatus.PENDING)
                : null;

        Long conversationId = null;
        boolean isConversationMember = false;
        var convOpt = conversationRepository.findByCommunityGroupId(group.getId());
        if (convOpt.isPresent()) {
            conversationId = convOpt.get().getId();
            if (activeMember && viewerMembership.getUser() != null) {
                isConversationMember = conversationParticipantRepository
                        .existsByConversationIdAndUserId(conversationId, viewerMembership.getUser().getId());
            }
        }

        return groupMapper.toDetail(group, viewerMembership, ownerProfile, canSeeInside, canSeeInside, pendingCount, conversationId, isConversationMember);
    }

    private CommunityGroup getVisibleGroup(Long groupId) {
        return groupRepository.findVisibleById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội nhóm."));
    }

    private void assertGroupActive(CommunityGroup group) {
        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new BadRequestException("Hội nhóm đang tạm ngừng hoạt động.");
        }
    }

    private boolean isManager(GroupMember membership) {
        return membership != null
                && membership.getMembershipStatus() == MembershipStatus.ACTIVE
                && (membership.getRole() == MembershipRole.OWNER || membership.getRole() == MembershipRole.ADMIN);
    }

    private GroupMember requireManager(CommunityGroup group, User user) {
        GroupMember membership = memberRepository.findByGroupIdAndUserId(group.getId(), user.getId()).orElse(null);
        if (!isManager(membership)) {
            throw new ForbiddenException("Bạn không có quyền quản lý hội nhóm này.");
        }
        return membership;
    }

    private GroupMember requireOwner(CommunityGroup group, User user) {
        GroupMember membership = requireManager(group, user);
        if (membership.getRole() != MembershipRole.OWNER) {
            throw new ForbiddenException("Chỉ chủ sở hữu hội nhóm mới có quyền thực hiện thao tác này.");
        }
        return membership;
    }

    private void applyJoinState(GroupMember membership, boolean isPublic) {
        if (isPublic) {
            membership.setMembershipStatus(MembershipStatus.ACTIVE);
            membership.setJoinedAt(Instant.now());
        } else {
            membership.setMembershipStatus(MembershipStatus.PENDING);
            membership.setJoinedAt(null);
        }
    }

    private User findUserOrNull(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email).orElse(null);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
    }

    private User requireMemberUser(String email, String forbiddenMessage) {
        User user = requireUser(email);
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return user;
    }

    private Map<Long, UserProfile> loadProfiles(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
    }

    private int sanitizeSize(int size) {
        return (size <= 0 || size > MAX_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : size;
    }

    private <E, R> PageResponse<R> toPageResponse(Page<E> page, Function<E, R> mapper) {
        return PageResponse.<R>builder()
                .content(page.getContent().stream().map(mapper).collect(Collectors.toList()))
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private record NormalizedInput(String name, String description, String coverImageUrl, String category,
                                   List<String> topics, String joinRules) {
    }

    /** Cắt khoảng trắng, kiểm tra danh mục hợp lệ và chuẩn hóa danh sách chủ đề (bỏ rỗng/trùng, tối đa 5, mỗi chủ đề ≤ 50 ký tự). */
    private NormalizedInput normalizeInput(String name, String description, String coverImageUrl, String category,
                                           List<String> topics, String joinRules) {
        String trimmedName = name == null ? "" : name.trim();
        String trimmedDescription = description == null ? "" : description.trim();
        if (trimmedName.isEmpty()) {
            throw new BadRequestException("Tên hội nhóm không được để trống");
        }
        if (trimmedDescription.isEmpty()) {
            throw new BadRequestException("Mô tả hội nhóm không được để trống");
        }
        String trimmedCategory = category == null ? "" : category.trim();
        if (!GroupCategories.isValid(trimmedCategory)) {
            throw new BadRequestException("Danh mục hội nhóm không hợp lệ.");
        }

        List<String> cleanedTopics = new ArrayList<>();
        if (topics != null) {
            for (String topic : topics) {
                String t = topic == null ? "" : topic.trim();
                if (t.isEmpty()) {
                    continue;
                }
                if (t.length() > MAX_TOPIC_LENGTH) {
                    throw new BadRequestException("Mỗi chủ đề không được vượt quá 50 ký tự.");
                }
                boolean duplicate = cleanedTopics.stream().anyMatch(existing -> existing.equalsIgnoreCase(t));
                if (!duplicate) {
                    cleanedTopics.add(t);
                }
            }
        }
        if (cleanedTopics.size() > CreateGroupRequest.MAX_TOPICS) {
            throw new BadRequestException("Chỉ được nhập tối đa 5 chủ đề.");
        }

        String cover = coverImageUrl == null || coverImageUrl.isBlank() ? null : coverImageUrl.trim();
        String rules = joinRules == null || joinRules.isBlank() ? null : joinRules.trim();
        return new NormalizedInput(trimmedName, trimmedDescription, cover, trimmedCategory,
                cleanedTopics.isEmpty() ? null : cleanedTopics, rules);
    }
}
