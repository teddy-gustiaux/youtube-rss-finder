# Integration tests

## Manual tests

All URLs are given as examples.

### New YouTube layout

- [ID-based channel](https://www.youtube.com/channel/UCsXVk37bltHxD1rDPwtNM8Q?disable_polymer=0)
- [Username-based channel](https://www.youtube.com/user/Kurzgesagt?disable_polymer=0)
- [Custom URL channel](https://www.youtube.com/c/creatoracademy?disable_polymer=0)
- [Custom URL channel (short version)](https://www.youtube.com/wesbos?disable_polymer=0)
- [Other page on the channel](https://www.youtube.com/user/Kurzgesagt/about?disable_polymer=0)
- [Watching video](https://www.youtube.com/watch?v=9P6rdqiybaw?disable_polymer=0)
- [Playlist](https://www.youtube.com/playlist?list=PLFs4vir_WsTzcfD7ZE8uO3yX-GCKUk9xZ&disable_polymer=0)
- [Home page](https://www.youtube.com?disable_polymer=0)
- [Random 404 page](https://www.youtube.com/randompage?disable_polymer=0)

### Old YouTube layout

- [ID-based channel](https://www.youtube.com/channel/UCsXVk37bltHxD1rDPwtNM8Q?disable_polymer=1)
- [Username-based channel](https://www.youtube.com/user/Kurzgesagt?disable_polymer=1)
- [Custom URL channel](https://www.youtube.com/c/creatoracademy?disable_polymer=1)
- [Custom URL channel (short version)](https://www.youtube.com/wesbos?disable_polymer=1)
- [Other page on the channel](https://www.youtube.com/user/Kurzgesagt/about?disable_polymer=1)
- [Watching video](https://www.youtube.com/watch?v=9P6rdqiybaw?disable_polymer=1)
- [Playlist](https://www.youtube.com/playlist?list=PLFs4vir_WsTzcfD7ZE8uO3yX-GCKUk9xZ&disable_polymer=1)
- [Home page](https://www.youtube.com?disable_polymer=0)
- [Random 404 page](https://www.youtube.com/randompage?disable_polymer=1)

### Common tests

- Navigate from one channel or playlist to other ones, and check the feed found is indeed the one from the newly accessed channel or playlist.
- Switch active tab and window, and return to a test page to check the feed is still correct (from either a non-YouTube URL or a YouTube URL).
- Reload the page.
