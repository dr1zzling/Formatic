import 'dart:typed_data';

/// Mobile stub — file download not implemented for mobile.
void triggerFileDownload(Uint8List bytes, String filename) {
  // No-op on mobile. Bytes are available but saving to disk
  // requires path_provider which is not in this project's dependencies.
}
