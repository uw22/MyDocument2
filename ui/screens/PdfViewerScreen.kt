
package com.docuscan.pro.ui.screens

import android.app.Application
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PdfViewerViewModel(application: Application) : AndroidViewModel(application) {
    private val _pdfPages = MutableStateFlow<List<Bitmap>>(emptyList())
    val pdfPages = _pdfPages.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    fun loadPdfFromUri(uri: Uri) {
        viewModelScope.launch {
            _error.value = null
            try {
                val context = getApplication<Application>().applicationContext
                val pfd = context.contentResolver.openFileDescriptor(uri, "r")
                if (pfd != null) {
                    val renderer = PdfRenderer(pfd)
                    val pages = withContext(Dispatchers.IO) {
                        (0 until renderer.pageCount).map { i ->
                            val page = renderer.openPage(i)
                            val bitmap = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                            page.close()
                            bitmap
                        }
                    }
                    _pdfPages.value = pages
                    renderer.close()
                    pfd.close()
                } else {
                    _error.value = "Konnte PDF-Datei nicht öffnen."
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _error.value = "Fehler beim Laden des PDFs: ${e.message}. (Hinweis: Der URI ist ein Mock-Wert.)"
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PdfViewerScreen(navController: NavController, docUri: String) {
    val viewModel: PdfViewerViewModel = viewModel()
    val pages by viewModel.pdfPages.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(docUri) {
        val uri = Uri.parse(docUri)
        viewModel.loadPdfFromUri(uri)
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("PDF Viewer") }, navigationIcon = {
            IconButton(onClick = { navController.popBackStack() }) {
                 Icon(painter = painterResource(id = android.R.drawable.ic_menu_close_clear_cancel), contentDescription = "Zurück")
            }
        }) }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.DarkGray)
        ) {
            if (error != null) {
                Text(text = error!!, color = Color.Red, modifier = Modifier.align(Alignment.Center).padding(16.dp))
            } else if (pages.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    items(pages) { bitmap ->
                        ZoomablePdfPage(bitmap = bitmap)
                    }
                }
            }
        }
    }
}

@Composable
fun ZoomablePdfPage(bitmap: Bitmap) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(bitmap.width.toFloat() / bitmap.height.toFloat())
            .background(Color.White)
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 4f)
                    val newOffsetX = (offset.x + pan.x * scale).coerceIn(-(bitmap.width * scale - width) / 2, (bitmap.width * scale - width) / 2)
                    val newOffsetY = (offset.y + pan.y * scale).coerceIn(-(bitmap.height * scale - height) / 2, (bitmap.height * scale - height) / 2)
                    offset = Offset(newOffsetX, newOffsetY)
                }
            }
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "PDF Seite",
            contentScale = ContentScale.Fit,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offset.x,
                    translationY = offset.y
                )
        )
    }
}
