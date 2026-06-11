import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class TestJjwt {
    public static void main(String[] args) {
        try {
            Map<String, Object> configFront = new HashMap<>();
            configFront.put("documentType", "word");
            Map<String, Object> document = new HashMap<>();
            document.put("fileType", "docx");
            configFront.put("document", document);

            String secret = "JjCtkxwMcOYX1sjvh4q53lhb2JYcSd_00";
            Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            
            String jws = Jwts.builder()
                    .setHeaderParam("typ", "JWT")
                    .setClaims(configFront)
                    .signWith(key, SignatureAlgorithm.HS256)
                    .compact();
            System.out.println("SUCCESS: " + jws);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
