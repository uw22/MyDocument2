
package com.docuscan.pro.services

import android.graphics.Bitmap
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.google.ai.client.generativeai.type.generationConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class AnalysisResult(
    val title: String,
    val category: String,
    val ocrText: String
)

class GeminiService(private val apiKey: String) {
    // Verwendung von gemini-3-flash-preview für hohe Geschwindigkeit
    private val model = GenerativeModel(
        modelName = "gemini-3-flash-preview",
        apiKey = apiKey,
        generationConfig = generationConfig {
            responseMimeType = "application/json"
        }
    )

    suspend fun analyzeDocument(bitmap: Bitmap): AnalysisResult? {
        return try {
            val prompt = "Analysiere dieses Dokument. 1. Erstelle einen kurzen Titel. 2. Wähle Kategorie: Arbeit, Gesundheit, Reisen, Finanzen, Zuhause. 3. OCR Text extrahieren. Antworte im JSON Format."
            
            val inputContent = content {
                image(bitmap)
                text(prompt)
            }

            val response = model.generateContent(inputContent)
            response.text?.let { 
                Json.decodeFromString<AnalysisResult>(it)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
