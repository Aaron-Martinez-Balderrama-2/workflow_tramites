package com.antigravity.workflow_tramites.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.stream.Collectors;

/**
 * Puente hacia el motor de IA en Python.
 * Soporta Multimedia (Imagen y Audio).
 */
@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    public String procesarPrompt(String promptUsuario, Object diagramaActual, String base64Image, String base64Audio) {
        String diagramaPath = saveTextToFile(diagramaActual != null ? diagramaActual.toString() : "", "ia_context", ".xml");
        String imgPath = saveBase64ToFile(base64Image, "ia_input_img", ".jpg");
        String audioPath = saveBase64ToFile(base64Audio, "ia_input_audio", ".mp3");
        
        return ejecutarPython(promptUsuario, "edicion", imgPath, audioPath, diagramaPath);
    }

    private String saveTextToFile(String text, String prefix, String suffix) {
        try {
            Path tempFile = Files.createTempFile(prefix, suffix);
            Files.write(tempFile, text.getBytes(StandardCharsets.UTF_8));
            return tempFile.toAbsolutePath().toString();
        } catch (Exception e) {
            return "null";
        }
    }

    public String verificarUsurpacion(String xmlDiagrama) {
        String diagramaPath = saveTextToFile(xmlDiagrama, "ia_usurpacion", ".xml");
        String input = "Analiza usurpacion de funciones en este BPMN.";
        String resultado = ejecutarPython(input, "analisis", "null", "null", diagramaPath);
        return "{\"mensaje\": \"" + resultado.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
    }

    public String autoLlenarFormulario(String promptUsuario, String formMetadata, String base64Audio) {
        String metadataPath = saveTextToFile(formMetadata != null ? formMetadata : "", "ia_form_meta", ".xml");
        String audioPath = saveBase64ToFile(base64Audio, "ia_input_audio", ".mp3");
        
        return ejecutarPython(promptUsuario != null ? promptUsuario : "", "llenado", "null", audioPath, metadataPath);
    }

    private String saveBase64ToFile(String base64, String prefix, String suffix) {
        if (base64 == null || base64.isEmpty()) return "null";
        try {
            // Limpiar cabecera data:image/jpeg;base64, si existe
            if (base64.contains(",")) {
                base64 = base64.split(",")[1];
            }
            byte[] data = Base64.getDecoder().decode(base64);
            Path tempFile = Files.createTempFile(prefix, suffix);
            Files.write(tempFile, data);
            return tempFile.toAbsolutePath().toString();
        } catch (Exception e) {
            System.err.println("Error guardando archivo temporal IA: " + e.getMessage());
            return "null";
        }
    }

    private String ejecutarPython(String prompt, String modo, String imgPath, String audioPath, String diagramaPath) {
        try {
            String scriptPath = "python_ia/gemini_asistente.py";
            if (!new java.io.File(scriptPath).exists()) {
                scriptPath = "../python_ia/gemini_asistente.py";
            }

            ProcessBuilder pb = new ProcessBuilder("python", scriptPath, prompt, modo, 
                                                    imgPath != null ? imgPath : "null", 
                                                    audioPath != null ? audioPath : "null",
                                                    diagramaPath != null ? diagramaPath : "null");
            
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8));
            String output = reader.lines().collect(Collectors.joining("\n"));
            
            int exitCode = process.waitFor();
            
            // Limpiar temporales
            if (imgPath != null && !imgPath.equals("null")) new File(imgPath).delete();
            if (audioPath != null && !audioPath.equals("null")) new File(audioPath).delete();
            if (diagramaPath != null && !diagramaPath.equals("null")) new File(diagramaPath).delete();

            if (exitCode == 0 && output.contains("--- RESULTADO FINAL ---")) {
                return output.split("--- RESULTADO FINAL ---")[1].trim();
            } else {
                return "Error en el Motor Python: " + output;
            }
        } catch (Exception e) {
            return "Error ejecutando puente Python: " + e.getMessage();
        }
    }
}
