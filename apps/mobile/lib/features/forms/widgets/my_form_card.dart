import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class MyFormCard extends StatelessWidget {
  final String title;
  final int questions;
  final int? responses;
  final String role;
  final String? visibility;
  final String? lastUpdated;
  final VoidCallback onTap;

  const MyFormCard({
    super.key,
    required this.title,
    required this.questions,
    this.responses,
    required this.role,
    this.visibility,
    this.lastUpdated,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: role == 'CREATOR'
                        ? AppColors.blueAccent.withOpacity(0.1)
                        : AppColors.textSecondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    role,
                    style: TextStyle(
                      color: role == 'CREATOR' ? AppColors.blueAccent : AppColors.textSecondary,
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
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                fontFamily: 'Plus Jakarta Sans',
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  Icons.help_outline,
                  size: 14,
                  color: AppColors.textSecondary,
                ),
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
                if (responses != null) ...[
                  Icon(
                    Icons.people_outline,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
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
                if (visibility != null) ...[
                  const SizedBox(width: 14),
                  Icon(
                    visibility == 'private' ? Icons.lock_outline : Icons.visibility_outlined,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    visibility!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ],
                if (lastUpdated != null) ...[
                  const SizedBox(width: 14),
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    lastUpdated!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
