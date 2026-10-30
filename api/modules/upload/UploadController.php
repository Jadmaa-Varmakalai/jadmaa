<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Upload;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;

class UploadController
{
    public function uploadImage(Request $request): void
    {
        $body = $request->getBody();
        $image = $body['image'] ?? null;
        $customName = $body['filename'] ?? 'upload';

        // 1. Check if multipart file upload
        if (isset($_FILES['image']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
            $file = $_FILES['image'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'])) {
                Response::error('Invalid image extension');
            }

            $uploadsDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
            if (!is_dir($uploadsDir)) {
                @mkdir($uploadsDir, 0755, true);
            }

            $filename = 'img_' . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6) . '.' . $ext;
            $destPath = $uploadsDir . DIRECTORY_SEPARATOR . $filename;

            if (move_uploaded_file($file['tmp_name'], $destPath)) {
                Response::success(['url' => "/uploads/{$filename}"]);
                return;
            }
        }

        // 2. Check if base64 data URL
        if (is_string($image) && !empty($image)) {
            if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
                Response::success(['url' => $image]);
                return;
            }

            if (preg_match('/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/', $image, $matches)) {
                $rawExt = strtolower($matches[1]);
                $ext = match ($rawExt) {
                    'jpeg' => 'jpg',
                    'svg+xml' => 'svg',
                    default => $rawExt,
                };
                $data = base64_decode($matches[2]);

                $uploadsDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
                if (!is_dir($uploadsDir)) {
                    @mkdir($uploadsDir, 0755, true);
                }

                $cleanBase = preg_replace('/[^a-zA-Z0-9_-]/', '_', substr(pathinfo($customName, PATHINFO_FILENAME), 0, 30));
                $filename = "{$cleanBase}_" . time() . '_' . substr(bin2hex(random_bytes(3)), 0, 6) . ".{$ext}";
                $destPath = $uploadsDir . DIRECTORY_SEPARATOR . $filename;

                if (file_put_contents($destPath, $data) !== false) {
                    Response::success(['url' => "/uploads/{$filename}"]);
                    return;
                }
            }

            // If regular string path, return as is
            Response::success(['url' => $image]);
            return;
        }

        Response::error('No image provided');
    }
}
