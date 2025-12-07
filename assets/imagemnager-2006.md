# ImageManager 2.0 (2006)

>Way back in 2006, I released ImageManager 2.0, a popular WordPress plugin for image management and editing. Below is the original documentation for that plugin.

The ImageManager plugin integrates the stand alone PHP ImageManager + Editor with WordPress. The ImageManager provides an interface for browsing and uploading image files on/to your server. The Editor allows for some basic image manipulations such as, cropping, rotation, flip, and scaling.



https://github.com/user-attachments/assets/13bd96db-5add-474b-a684-88e864a91513

**Current Version: 2.4.1 (WordPress 2.1 and WPMU support)**

**NOTE, the plugin is only tested with WordPress 2.0 and WordPress 2.1**

## Feature list

- Simple image editor (crop, rotate, flip, and scale).
- Upload and delete images.
- Can be localized using the included ImageManager.pot file.
- Language files: Chinese, English (default), German, Japanese, Norwegian and Spanish.
- Supports the Role Manager plugin. Capabilities: Upload Files, Make Direcory, Edit Image and Delete Image.
- Add style using inline style or by setting a class name.
- Insert the selected image as; the original image, thumbnail with popup (create mini galleries), thumbnail with a link to the original image, thumbnail, or a text link to the original image.
- Lightbox support. Added rel=”lightbox” to the Thumbnail with link to image and to Link to image. This should make it possible to use the WP lightbox JS or other lightbox plugins together with ImageManager.
- You can disable the native WordPress Upload Files.


**Version History (Change log)**

- v2.4.1 (January 29 2007) download (80 downloads)

	Minor fix, I forgot to update the tracking/version number.
- v2.4.0 (January 29 2007) download (3 downloads)

	Bugfix: Error: openImageManager is not defined and the popup should resize to correctly.
- v2.3.9 (January 24 2007) download (1225 downloads)

	Bug fix
- v2.3.8 (January 24 2007) download (24 downloads)

	WordPress 2.1 support added. If you’re not running WordPress 2.1, you don’t need this update.
- v2.3.7 (April 2 2006) download (208 downloads)

	Added Insert Image Defaults to the Option Page, which allows you to preconfigure how you’d like the images to be inserted.
	Minor bug fixes
- v2.3.6 (Mars 27 2006) download (783 downloads)

	Maintenance release, fixes short tags, missing popup and some minor bugs. Also, Ralph @ http://rainonline.ws has helped me cleaning the localization in the Option page. The incuded ImageManager.pot is updated
- v2.3.5 (Mars 23 2006) download (529 downloads)

	SECURITY UPDATE, everyone should upgrade to this version.
- v2.3.4 (Mars 18 2006) download (555 downloads)

	Added Thumbnail with PopUp, which allows you to create mini galleries.

	Added lightbox support (rel=”lightbox”) to the Thumbnail with link to image and to Link to image. This should make it possible to use the WP lightbox JS or other lightbox plugins together with ImageManager.

	Added translation support for the Options page (please upload translations to the forum).
	Minor fixes; set border=”0″ as default, added width and height to thumbnails.
- v2.3.3 (February 26 2006) download (1499 downloads)

	For you who are running the Role Manager plugin, I’ve added two more capabilities; Edit Image and Delete Image.

	All php short tags are converted to regular php opening tag.
- v2.3.2 (February 23 2006) download (288 downloads)

	Fixed a major bug in the image editor, if you’re running - v2.3.0 or - v2.3.1, this version is a must.
- v2.3.1 (February 21 2006) download (251 downloads)

	Added the title attribute (same value as the alt attribute).

	Added the style attribute, which allows you to add inline style.

	Added the class attribute, which allows you to set a class name.

	The lang/ImageManager.pot file is updated to reflect these changes
- v2.3.0 (February 20 2006) download (255 downloads)

	Localization: Added gettext support, you can now translate the plugin (see below). If you don’t need localization, you don’t have to upgrade to - v2.3.0.
- v2.2.0 (January 22 2006) download (950 downloads)

	Added the option to insert the selected image as; the original image, thumbnail with a link to the original image, thumbnail, or a text link to the original image.
- v2.1.3 (January 20 2006) download (258 downloads)

	bugfix for this error: “Parse error: parse error, unexpected T_VARIABLE in wp-content/plugins/ImageManager/classes/transform.php on line 130″
- v2.1.2 (January 17 2006) download (688 downloads)

	Added the option to disable the native WordPress Upload Files.

	Fixed minor bugs
- v2.1.1 (January 13 2006) download (290 downloads)

	Changed the role names, ImageManager is now using the Upload Files and Make Direcory roles if you are using Role Manager. After upgrading from the privious version, remember to set the new roles.

	ImageManager will add a trailing slash to the library path if you forgot to add it.

	All filenames are now in lower case and the calls to them reflect this. Remeber to flush the browser cache if you are upgrading from a previous version.
- v2.1.0 (January 8 2006) download (451 downloads)

	Added support for the Role Manager Plugin.
- v2.0.1 (January 4 2006) download (227 downloads)

	Fixed one major bug (wrong option name in get_option()) + some minor bugs
- v2.0.0 (January 3 2006) download (338 downloads)