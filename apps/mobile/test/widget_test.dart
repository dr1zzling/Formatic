import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App shows login screen when logged out', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp(isLoggedIn: false));

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });

  testWidgets('App shows home screen when logged in', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp(isLoggedIn: true));

    expect(find.text('Home'), findsOneWidget);
  });
}
