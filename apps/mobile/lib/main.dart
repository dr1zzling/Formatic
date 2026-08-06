import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/forms/screens/add_question_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Formatic',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const LoginScreen(),
      routes: {
        '/add-question': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return AddQuestionScreen(
            formId: args['formId'],
            formTitle: args['formTitle'],
          );
        },
      },
    );
  }
}
