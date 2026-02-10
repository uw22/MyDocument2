
package com.docuscan.pro.ui.components

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.res.painterResource
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import android.R

@Composable
fun AppBottomNavigation(navController: NavController) {
    val items = listOf("dashboard", "categories", "secure", "settings")
    NavigationBar {
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentRoute = navBackStackEntry?.destination?.route
        items.forEach { screen ->
            NavigationBarItem(
                icon = { Icon(painterResource(id = R.drawable.ic_dialog_map), contentDescription = screen) },
                label = { Text(screen.capitalize()) },
                selected = currentRoute == screen,
                onClick = {
                    navController.navigate(screen) {
                        popUpTo(navController.graph.startDestinationId)
                        launchSingleTop = true
                    }
                }
            )
        }
    }
}
