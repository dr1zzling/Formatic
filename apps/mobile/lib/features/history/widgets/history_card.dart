import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class HistoryCard extends StatelessWidget {
  final String title;
  final String date;
  final String type;
  final int responses;

  const HistoryCard({
    super.key,
    required this.title,
    required this.date,
    required this.type,
    required this.responses,
  });

  Color _getTypeColor() {
    switch (type.toLowerCase()) {
      case 'ujian':
      case 'exam':
        return AppColors.catUjian;
      case 'survey':
        return AppColors.catSurvey;
      default:
        return AppColors.catDefault;
    }
  }

  Color _getTypeBgColor() {
    switch (type.toLowerCase()) {
      case 'ujian':
      case 'exam':
        return AppColors.catUjianBg;
      case 'survey':
        return AppColors.catSurveyBg;
      default:
        return AppColors.catDefaultBg;
    }
  }

  @override
  Widget build(BuildContext context) {
    final typeColor = _getTypeColor();
    final typeBg = _getTypeBgColor();

    return Container(
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
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: typeBg,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(
              Icons.description_outlined,
              color: typeColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      type,
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 3,
                      height: 3,
                      decoration: BoxDecoration(
                        color: AppColors.textHint,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      date,
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: AppColors.textHint,
            size: 18,
          ),
        ],
      ),
    );
  }
}
