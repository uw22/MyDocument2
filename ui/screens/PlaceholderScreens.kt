
package com.docuscan.pro.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavController

@Composable
fun DashboardScreen(navController: NavController) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Dashboard Screen")
    }
}

@Composable
fun ScanScreen(navController: NavController) {
     Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Scan Screen")
    }
}

@Composable
fun CategoriesScreen(navController: NavController) {
     Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Categories Screen")
    }
}

@Composable
fun SecureFolderScreen(navController: NavController) {
     Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Secure Folder Screen")
    }
}

@Composable
fun SettingsScreen(navController: NavController) {
     Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = "Settings Screen")
    }
}
