<?php

namespace MediaManagerTests;

use Brain\Monkey;
use VirtualMediaFolders\Suggestions;
use PHPUnit\Framework\TestCase;

class SuggestionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_capture_suggestions_stores_meta_on_create(): void
    {
        Monkey\Functions\when('get_post_mime_type')->justReturn('image/jpeg');
        Monkey\Functions\expect('update_post_meta')
            ->once();

        $metadata = [
            'image_meta' => [
                'created_timestamp' => 1764307200, // 2025-11-28
                'keywords'          => ['Nature', 'Landscape'],
            ],
        ];

        $result = Suggestions::capture_suggestions($metadata, 123, 'create');

        $this->assertSame($metadata, $result);
    }

    public function test_capture_suggestions_does_nothing_on_update(): void
    {
        Monkey\Functions\when('get_post_mime_type')->justReturn('image/jpeg');
        Monkey\Functions\expect('update_post_meta')
            ->never();

        $metadata = [];

        $result = Suggestions::capture_suggestions($metadata, 123, 'update');

        $this->assertSame($metadata, $result);
    }
}
