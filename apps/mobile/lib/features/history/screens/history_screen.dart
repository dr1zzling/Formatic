import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/history_card.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<Map<String, dynamic>> _historyItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
    });

    await Future.delayed(const Duration(milliseconds: 500));

    setState(() {
      _historyItems = [];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  const Text(
                    'History',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: _showInfoDialog,
                    icon: Icon(Icons.info_outline, color: AppColors.blueButton),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.blueAccent))
                  : _historyItems.isEmpty
                      ? _buildEmptyState(context)
                      : RefreshIndicator(
                          onRefresh: _loadHistory,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: _historyItems.length,
                            itemBuilder: (context, index) {
                              final item = _historyItems[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: HistoryCard(
                                  title: item['title'],
                                  date: item['date'],
                                  type: item['type'],
                                  responses: item['responses'],
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.info_outline, color: AppColors.blueAccent),
            SizedBox(width: 12),
            Text('History Feature'),
          ],
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: const Text(
          'Riwayat pengisian form per pengguna belum tersedia karena backend tidak '
          'menyediakan endpoint pengambilan riwayat by-user.\n\n'
          'Endpoint yang tersedia saat ini:\n'
          '• GET /form/submit?form_slug= (kurasi hasil per form)\n'
          '• GET /form/submit/detail?form_slug= (detail jawaban, khusus pemilik)\n\n'
          'Anda dapat melihat respons per form dari tab My Forms (lihat detail form).\n'
          'Status: blocker backend — bukan dapat diperbaiki dari sisi aplikasi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Got it', style: TextStyle(color: AppColors.blueAccent)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.blueAccent.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.history,
                size: 60,
                color: AppColors.blueAccent,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No History Yet',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                fontFamily: 'Plus Jakarta Sans',
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your form submission history will\nappear here once backend endpoints\nare available',
              style: TextStyle(
                fontSize: 15,
                color: AppColors.textSecondary,
                fontFamily: 'Plus Jakarta Sans',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _showInfoDialog,
              icon: const Icon(Icons.info_outline),
              label: const Text('Learn More'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.blueAccent,
                side: const BorderSide(color: AppColors.blueAccent),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
