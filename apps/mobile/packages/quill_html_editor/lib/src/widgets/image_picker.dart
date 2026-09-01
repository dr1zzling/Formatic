import 'dart:async';
import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

///[ImageSelector] to pick files or media, supports all platforms
/// Patched for file_picker ^12.x compatibility (uses FilePickerPlatform.instance)
class ImageSelector {
  ///[onImagePicked] callback function for image picker
  final Function(String) onImagePicked;

  ///[ImageSelector] image selector widget to set images to editor
  ImageSelector({required this.onImagePicked});

  ///[pickFiles] to pick the files
  Future<void> pickFiles() async {
    try {
      // file_picker 12.x: FilePickerPlatform.instance.pickFiles() returns
      // List<PlatformFile> directly (no FilePickerResult wrapper).
      final result = await FilePickerPlatform.instance.pickFiles(
        type: FileType.image,
      );

      if (result.isEmpty) return;

      final file = result.first;
      // Bytes are read via xFile.readAsBytes() in file_picker 12.x.
      final bytes = await file.xFile.readAsBytes();
      if (bytes.isEmpty) return;

      final base64String = base64Encode(bytes);
      onImagePicked('data:image/${file.extension};base64,$base64String');
    } on PlatformException catch (e) {
      debugPrint('Unsupported operation $e');
    } catch (e) {
      debugPrint('File Picker ${e.toString()}');
    }
  }
}

///[OnPickImageCallback] typedef for onPickImageCallback
typedef OnPickImageCallback = void Function(
    double? maxWidth, double? maxHeight, int? quality);
