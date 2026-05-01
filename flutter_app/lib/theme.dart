import 'package:flutter/material.dart';

// Brand colors matching web version
class WColors {
  static const gold = Color(0xFFD4AF37);
  static const goldLt = Color(0xFFF5E070);
  static const goldDk = Color(0xFF7A5C10);
  static const deep = Color(0xFF000005);
  static const ink = Color(0xFF000010);
  static const green = Color(0xFF00FF88);
  static const amber = Color(0xFFF07000);
  static const red = Color(0xFFFF3333);
  static const cyan = Color(0xFF00C8FF);
}

final wipulscanTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: WColors.deep,
  colorScheme: const ColorScheme.dark(
    primary: WColors.gold,
    secondary: WColors.goldLt,
    surface: WColors.ink,
    error: WColors.red,
  ),
  fontFamily: 'SpaceGrotesk',
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    elevation: 0,
  ),
);

// Signal % → Color
Color sigColor(int pct) {
  if (pct >= 72) return WColors.green;
  if (pct >= 50) return WColors.gold;
  if (pct >= 28) return WColors.amber;
  return WColors.red;
}

// Signal % → dBm
int sigToDBm(int pct) => (pct / 100 * 75 - 95).round();

// Signal % → RGB for cloud rendering (Smooth flowing color like CobraNebula)
Color sigToCloudColor(int pct) {
  final p = pct.clamp(0, 100).toDouble();
  final int r = p < 50 ? 255 : (255 - (p - 50) * 5.1).floor();
  final int g = p < 50 ? (p * 5.1).floor() : 255;
  final int b = (255 - p * 2).floor();
  return Color.fromARGB(255, r, g, b);
}
