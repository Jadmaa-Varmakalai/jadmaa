<?php
declare(strict_types=1);

namespace Jadmaa\Modules\Reviews;

use Jadmaa\Core\Request;
use Jadmaa\Core\Response;

class ReviewsController
{
    public function getReviews(Request $request): void
    {
        $apiKey = getenv('GOOGLE_MAPS_API_KEY');
        $placeId = 'ChIJjTIYIgC5qjsRcL6Q-fCDunM'; // Thanjavur branch

        if (empty($apiKey)) {
            Response::success([]);
            return;
        }

        $url = "https://places.googleapis.com/v1/places/{$placeId}?fields=id,displayName,reviews";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-Goog-Api-Key: {$apiKey}"]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);

        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $data = json_decode($res ?: '{}', true);
            $reviews = $data['reviews'] ?? [];

            $testimonials = array_map(function ($r) {
                return [
                    'id' => $r['name'] ?? '',
                    'name' => $r['authorAttribution']['displayName'] ?? 'Valued Student',
                    'role' => 'Student',
                    'content' => $r['text']['text'] ?? ($r['originalText']['text'] ?? 'Traditional Varmakalai has transformed my discipline and focus.'),
                    'rating' => $r['rating'] ?? 5,
                    'avatar' => $r['authorAttribution']['photoUri'] ?? '',
                    'publishTime' => $r['publishTime'] ?? date('c'),
                ];
            }, $reviews);

            Response::success($testimonials);
            return;
        }

        Response::success([]);
    }
}
