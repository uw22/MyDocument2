
package com.docuscan.pro.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.pdf.PdfDocument
import android.os.Environment
import java.io.File
import java.io.FileOutputStream

class PdfExportService(private val context: Context) {
    fun exportToPdf(bitmap: Bitmap, fileName: String): File? {
        val pdfDocument = PdfDocument()
        // Standard A4 bei 72 DPI: 595 x 842
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdfDocument.startPage(pageInfo)

        val canvas: Canvas = page.canvas
        
        // Bild skalieren, um auf A4 Seite zu passen
        val scale = Math.min(
            canvas.width.toFloat() / bitmap.width,
            canvas.height.toFloat() / bitmap.height
        )
        
        val left = (canvas.width - bitmap.width * scale) / 2
        val top = (canvas.height - bitmap.height * scale) / 2
        
        canvas.save()
        canvas.translate(left, top)
        canvas.scale(scale, scale)
        canvas.drawBitmap(bitmap, 0f, 0f, null)
        canvas.restore()

        pdfDocument.finishPage(page)

        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "$fileName.pdf")
        return try {
            pdfDocument.writeTo(FileOutputStream(file))
            pdfDocument.close()
            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
