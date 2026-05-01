import 'package:flutter/material.dart';
import 'package:wipulscan_pro/theme.dart';

class ConsentScreen extends StatefulWidget {
  final VoidCallback onAccept;
  const ConsentScreen({super.key, required this.onAccept});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _checked = false;

  void _openPrivacy() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const _ConsentPrivacyView()));
  }

  void _openImprint() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const _ConsentImprintView()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WColors.deep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              // Eye icon
              Icon(Icons.visibility_outlined, size: 40, color: WColors.gold.withOpacity(0.5)),
              const SizedBox(height: 20),
              ShaderMask(
                shaderCallback: (rect) => const LinearGradient(
                  colors: [WColors.goldLt, WColors.gold],
                ).createShader(rect),
                child: const Text('WIPULSCAN PRO',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 3, color: Colors.white)),
              ),
              const SizedBox(height: 8),
              Text('Privacy & Terms', style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.3))),
              const SizedBox(height: 24),
              // Privacy text (scrollable)
              Expanded(
                flex: 3,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: WColors.gold.withOpacity(0.08)),
                    color: Colors.white.withOpacity(0.02),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      'WIPULSCAN PRO measures your WiFi signal strength and connection quality. '
                      'All measurements are performed locally on your device.\n\n'
                      'Data collected:\n'
                      '• WiFi signal strength (RSSI/dBm)\n'
                      '• Connection speed and latency\n'
                      '• Device sensors (gyroscope, accelerometer)\n'
                      '• Camera feed (AR overlay only, never recorded)\n\n'
                      'No personal data is collected, stored on servers, or shared with third parties. '
                      'Camera frames are processed in real-time for AR visualization and are never recorded or transmitted.\n\n'
                      'WIPULSCAN does NOT read, intercept, or access any passwords, network traffic content, '
                      'browsing history, or data from other applications.\n\n'
                      'Network speed tests connect to Cloudflare\'s public CDN (1.1.1.1, speed.cloudflare.com). '
                      'No other external services are contacted. No analytics or tracking SDKs are used.\n\n'
                      '© 2026 Cobra Dynamics. All Rights Reserved.\n'
                      'Contact: privacy@cobradynamics.com',
                      style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.4), height: 1.6),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Links to full Privacy Policy and Imprint
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: _openPrivacy,
                    child: Text('Privacy Policy',
                      style: TextStyle(fontSize: 10, color: WColors.gold.withOpacity(0.5),
                        decoration: TextDecoration.underline, decorationColor: WColors.gold.withOpacity(0.3))),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('·', style: TextStyle(color: WColors.gold.withOpacity(0.2))),
                  ),
                  GestureDetector(
                    onTap: _openImprint,
                    child: Text('Impressum',
                      style: TextStyle(fontSize: 10, color: WColors.gold.withOpacity(0.5),
                        decoration: TextDecoration.underline, decorationColor: WColors.gold.withOpacity(0.3))),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Checkbox
              Row(
                children: [
                  Checkbox(
                    value: _checked,
                    onChanged: (v) => setState(() => _checked = v ?? false),
                    activeColor: WColors.gold,
                    side: BorderSide(color: WColors.gold.withOpacity(0.3)),
                  ),
                  Expanded(
                    child: Text('I accept the Privacy Policy and Terms of Use',
                      style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5))),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Accept button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _checked ? widget.onAccept : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: WColors.gold,
                    disabledBackgroundColor: WColors.gold.withOpacity(0.15),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, letterSpacing: 2),
                  ),
                  child: const Text('CONTINUE'),
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Full Privacy Policy (reachable from consent) ───
class _ConsentPrivacyView extends StatelessWidget {
  const _ConsentPrivacyView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WColors.deep,
      appBar: AppBar(
        title: const Text('Privacy Policy', style: TextStyle(fontSize: 14, letterSpacing: 1.5)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          'WIPULSCAN PRO – Privacy Policy\n'
          'Last updated: April 2026\n\n'
          '1. DATA CONTROLLER\n'
          'Cobra Dynamics\n'
          'E-Mail: privacy@cobradynamics.com\n\n'
          '2. DATA COLLECTED\n'
          '• WiFi signal strength (RSSI in dBm) – Android only\n'
          '• Network quality (RTT, download speed) – via Cloudflare CDN\n'
          '• Device motion data (gyroscope, accelerometer)\n'
          '• Camera frames (real-time AR only, never stored)\n\n'
          '3. DATA STORAGE\n'
          'All data processed locally. No persistent storage except consent flag and purchase status.\n\n'
          '4. DATA TRANSMISSION\n'
          'No personal data transmitted. Only HTTPS requests to Cloudflare for speed tests and store APIs for IAP.\n\n'
          '5. PASSWORDS & CONTENT\n'
          'WIPULSCAN does NOT access passwords, network traffic, browsing history, or other app data.\n\n'
          '6. YOUR RIGHTS (GDPR)\n'
          'No personal data collected on servers. Revoke consent by clearing app data or uninstalling.\n\n'
          '7. CONTACT\n'
          'privacy@cobradynamics.com\n',
          style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.7),
        ),
      ),
    );
  }
}

// ─── Impressum (reachable from consent) ───
class _ConsentImprintView extends StatelessWidget {
  const _ConsentImprintView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WColors.deep,
      appBar: AppBar(
        title: const Text('Impressum', style: TextStyle(fontSize: 14, letterSpacing: 1.5)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          'IMPRESSUM\n\n'
          'Angaben gemäß § 5 TMG:\n\n'
          'Cobra Dynamics\n'
          'E-Mail: contact@cobradynamics.com\n'
          'Web: cobradynamics.com\n\n'
          'Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV):\n'
          'Cobra Dynamics\n\n'
          '© 2026 Cobra Dynamics. All Rights Reserved.\n',
          style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.7),
        ),
      ),
    );
  }
}
