import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import java.util.Map;

public class TestSpel {
    public static void main(String[] args) throws Exception {
        String variablesJson = "{\"tipo_tramite\":\"software\"}";
        Map<String, Object> vars = new ObjectMapper().readValue(variablesJson, Map.class);
        
        ExpressionParser parser = new SpelExpressionParser();
        StandardEvaluationContext context = new StandardEvaluationContext(vars);
        context.addPropertyAccessor(new org.springframework.context.expression.MapAccessor());
        
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            context.setVariable(entry.getKey(), entry.getValue());
        }
        
        String expr = "${tipo_tramite == 'software'}";
        expr = expr.replaceAll("^\\$\\{", "").replaceAll("\\}$", "");
        for (String key : vars.keySet()) {
            expr = expr.replaceAll("\\b" + key + "\\b", "#" + key);
        }
        
        System.out.println("Expression to evaluate: " + expr);
        try {
            Boolean result = parser.parseExpression(expr).getValue(context, Boolean.class);
            System.out.println("Result: " + result);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
