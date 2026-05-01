import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:wipulscan_pro/services/wifi_service.dart';
import 'package:wipulscan_pro/services/purchase_service.dart';
import 'package:wipulscan_pro/screens/intro_screen.dart';
import 'package:wipulscan_pro/screens/consent_screen.dart';
import 'package:wipulscan_pro/screens/ar_heatmap_screen.dart';
import 'package:wipulscan_pro/theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  // Immersive fullscreen
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF000005),
  ));

  final prefs = await SharedPreferences.getInstance();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WifiService()),
        ChangeNotifierProvider(create: (_) => PurchaseService()),
      ],
      child: WipulscanApp(prefs: prefs),
    ),
  );
}

class WipulscanApp extends StatefulWidget {
  final SharedPreferences prefs;
  const WipulscanApp({super.key, required this.prefs});

  @override
  State<WipulscanApp> createState() => _WipulscanAppState();
}

class _WipulscanAppState extends State<WipulscanApp> {
  late String _flow; // consent | intro | app

  @override
  void initState() {
    super.initState();
    final consent = widget.prefs.getBool('wps_consent') ?? false;
    _flow = consent ? 'intro' : 'consent';

    // Init IAP after first frame (context not ready in initState)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PurchaseService>().init();
    });
  }

  void _onConsent() {
    widget.prefs.setBool('wps_consent', true);
    setState(() => _flow = 'intro');
  }

  void _onIntroComplete() {
    setState(() => _flow = 'app');
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'WIPULSCAN PRO',
      debugShowCheckedModeBanner: false,
      theme: wipulscanTheme,
      home: _buildScreen(),
    );
  }

  Widget _buildScreen() {
    switch (_flow) {
      case 'consent':
        return ConsentScreen(onAccept: _onConsent);
      case 'intro':
        return IntroScreen(onComplete: _onIntroComplete);
      case 'app':
        return const ArHeatmapScreen();
      default:
        return const SizedBox.shrink();
    }
  }
}
