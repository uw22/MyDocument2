
package com.docuscan.pro.ui.screens

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailsScreen(navController: NavController, docId: String?) {
    // Mock-Logik, um ein PDF-Dokument zu simulieren.
    // In einer echten App würde dies aus einer Datenbank geladen.
    val isPdf = docId == "1" 
    val docName = if (isPdf) "Beispielrechnung.pdf" else "AnderesDokument.jpg"
    
    // WICHTIG: Dieser URI ist ein Platzhalter.
    // Sie müssten einen echten Content-URI von einem FileProvider oder dem MediaStore verwenden.
    val mockPdfUri = "content://com.docuscan.pro.provider/files/sample.pdf"

    Scaffold(
        topBar = { TopAppBar(title = { Text("Dokumentdetails") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(docName, style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(24.dp))

            if (isPdf) {
                Text("Dies ist ein PDF-Dokument.")
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = {
                    val encodedUri = URLEncoder.encode(mockPdfUri, StandardCharsets.UTF_8.toString())
                    navController.navigate("pdfViewer/$encodedUri")
                }) {
                    Text("PDF im internen Viewer öffnen")
                }
            } else {
                Text("Dies ist kein PDF-Dokument.")
            }
        }
    }
}
