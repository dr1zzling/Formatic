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

    // For now, show message that history feature needs backend
    // In real implementation, this would fetch from submission history endpoint
    
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
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Text(
                    'History',
                    style: Theme.of(context).textTheme.displayMedium?.copyWith(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () {
                      _showInfoDialog();
                    },
                    icon: const Icon(Icons.info_outline),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
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
            Icon(Icons.info_outline, color: AppColors.primary),
            SizedBox(width: 12),
            Text('History Feature'),
          ],
        ),
        content: const Text(
          'Form submission history feature requires backend endpoints:\n\n'
          '• GET /form/:id/responses\n'
          '• POST /form/:id/response\n\n'
          'Once backend team implements these endpoints, you\'ll be able to see:\n'
          '• Your submitted forms\n'
          '• Submission timestamps\n'
          '• Response details',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Got it'),
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
                color: AppColors.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.history,
                size: 60,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No History Yet',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your form submission history will\nappear here once backend endpoints\nare available',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 15,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: _showInfoDialog,
              icon: const Icon(Icons.info_outline),
              label: const Text('Learn More'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
