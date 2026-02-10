
package com.docuscan.pro

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.docuscan.pro.ui.components.AppBottomNavigation
import com.docuscan.pro.ui.screens.*
import com.docuscan.pro.ui.theme.DocuScanTheme
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DocuScanTheme {
                val navController = rememberNavController()
                Scaffold(
                    bottomBar = { AppBottomNavigation(navController) }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "dashboard",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("dashboard") { DashboardScreen(navController) }
                        composable("scan") { ScanScreen(navController) }
                        composable("categories") { CategoriesScreen(navController) }
                        composable("secure") { SecureFolderScreen(navController) }
                        composable("settings") { SettingsScreen(navController) }
                        
                        composable("details/{docId}") { backStackEntry ->
                            DetailsScreen(
                                navController, 
                                backStackEntry.arguments?.getString("docId")
                            )
                        }
                        
                        composable(
                            "pdfViewer/{docUri}",
                            arguments = listOf(navArgument("docUri") { type = NavType.StringType })
                        ) { backStackEntry ->
                            val uriString = backStackEntry.arguments?.getString("docUri") ?: ""
                            val decodedUri = URLDecoder.decode(uriString, StandardCharsets.UTF_8.toString())
                            PdfViewerScreen(navController, decodedUri)
                        }
                    }
                }
            }
        }
    }
}
