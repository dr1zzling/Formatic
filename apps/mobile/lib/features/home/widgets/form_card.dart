import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class FormCard extends StatelessWidget {
  final String title;
  final int questions;
  final String responses;
  final String badge;
  final bool hasImage;

  const FormCard({
    super.key,
    required this.title,
    required this.questions,
    required this.responses,
    required this.badge,
    required this.hasImage,
  });

  Color _getBadgeColor() {
    switch (badge.toLowerCase()) {
      case 'public':
        return AppColors.blueAccent;
      case 'private':
        return AppColors.textSecondary;
      default:
        return AppColors.blueAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.cardShadow,
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getBadgeColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(
                      color: _getBadgeColor(),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ),
                const Spacer(),
                Icon(
                  Icons.more_vert,
                  color: AppColors.textHint,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                fontFamily: 'Plus Jakarta Sans',
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.help_outline, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '$questions Questions',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontFamily: 'Plus Jakarta Sans',
                  ),
                ),
                const SizedBox(width: 14),
                Icon(Icons.people_outline, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  '$responses Responses',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontFamily: 'Plus Jakarta Sans',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
