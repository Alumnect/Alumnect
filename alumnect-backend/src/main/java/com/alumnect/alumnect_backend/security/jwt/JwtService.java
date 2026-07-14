package com.alumnect.alumnect_backend.security.jwt;

import com.alumnect.alumnect_backend.entity.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Lớp dịch vụ xử lý JWT (JSON Web Token).
 * Hỗ trợ tạo mới token, giải mã token để lấy thông tin (claims) và kiểm tra
 * tính hợp lệ của token.
 */
@Service
public class JwtService {

    // Khóa bí mật dùng để ký token mã hóa Base64 (được tiêm vào từ file cấu
    // hình/môi trường)
    @Value("${app.jwt.secret}")
    private String keySecret;

    // Thời gian sống của Access Token (mili-giây), được tiêm vào từ file cấu
    // hình/môi trường
    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    // Thời gian sống của Refresh Token (mili-giây) — BR-03: 7 ngày
    @Value("${app.jwt.refresh-expiration}")
    private long jwtRefreshExpiration;

    /**
     * Tạo token JWT mới dựa trên thông tin người dùng.
     * Lưu trữ các thông tin bổ sung (claims): ID, email, vai trò (role) và trạng
     * thái duyệt hồ sơ.
     *
     * @param user Đối tượng người dùng
     * @return Chuỗi token JWT được ký bằng thuật toán HS256
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("email", user.getEmail());
        if (user.getRole() != null) {
            claims.put("role", user.getRole().getName());
        }
        claims.put("isAccountVerified", user.isAccountVerified());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Tạo Refresh Token JWT mới dựa trên thông tin người dùng.
     * Refresh Token có thời hạn 7 ngày và lưu thông tin tối thiểu (email) làm
     * Subject.
     * Token thực tế gửi về Client là JWT; khi lưu CSDL phải băm SHA-256.
     *
     * @param user Đối tượng người dùng
     * @return Chuỗi Refresh Token JWT được ký bằng thuật toán HS256
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("email", user.getEmail());
        if (user.getRole() != null) {
            claims.put("role", user.getRole().getName());
        }

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtRefreshExpiration))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Lấy khóa dùng để ký token giải mã từ Base64 keySecret.
     */
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(keySecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Giải mã toàn bộ thông tin (claims) trong JWT token.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Trích xuất thông tin cụ thể (claim) từ token bằng hàm resolver.
     */
    public <T> T extractClaims(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Trích xuất thời điểm hết hạn của token.
     */
    public Date extractExpiration(String token) {
        return extractClaims(token, Claims::getExpiration);
    }

    /**
     * Trích xuất email (Subject) của người dùng từ token.
     */
    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    /**
     * Kiểm tra xem token đã hết hạn chưa.
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Xác thực token: email trong token trùng với email UserDetails và token chưa
     * hết hạn.
     *
     * @param token       Chuỗi token JWT cần kiểm tra
     * @param userDetails Thông tin chi tiết của người dùng hiện tại
     * @return true nếu token hợp lệ, ngược lại false
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
