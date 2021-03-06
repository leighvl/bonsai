/**
 * Contains the Asset controller
 *
 * @exports AssetController
 */
define([
  '../tools',
  '../event_emitter',
  './asset_request',
  './font_handler',
  './video_handler',
  './bitmap_handler',
  './raw_handler'
],
function(
  tools, EventEmitter, AssetRequest,
  FontHandler, VideoHandler, BitmapHandler, RawHandler
) {
  'use strict';

  // save references to all assets (TODO: rethink)
  AssetController.assets = {};

  AssetController.hasVideoSupport = function() {
    return !!domVideo.canPlayType;
  };

  /**
  * Receiver of asset-load messages from worker.
  * Loads assets and returns an `assetLoaded` event.
  *
  * @class
  * @mixes EventEmitter
  */
  function AssetController() {

  }

  /**
   * Type handlers for different asset types. E.g. Bitmap, Text, Font, Video
   */
  var handlers = AssetController.handlers = {

    /**
     * Type handler for images
     */
    Bitmap: BitmapHandler,

    /**
     * Type handler for font
     */
    Font: FontHandler,

    /**
     * Type handler for video
     */
    Video: VideoHandler,

    /**
     * Type handler for raw data [txt, json, html]
     */
    Raw: RawHandler

  };

  AssetController.prototype = {

    /**
     * Destroys our reference to the asset's corresponding data/element.
     * (<img> or <video> etc.)
     */
    destroy: function(assetId) {
      delete AssetController.assets[assetId];
    },

    /**
     * Loads asset
     *
     * @param {object} data Asset data
     * @param {string} data.source URI source for image
     * @param {string} [data.type] source type (generic)
     * @param {string} [eventToFire=assetLoaded] The event to fire
     * @returns {this}
     */
    load: function(data, successEvent, errorEvent) {

      successEvent = successEvent || 'assetLoadSuccess';
      errorEvent = errorEvent || 'assetLoadError';

      var displayObjectType = data.type;

      if (displayObjectType in handlers) {

        new handlers[displayObjectType](data.request, data.id)
          .on('registerElement', function(element) {
            AssetController.assets[data.id] = element;
          })
          .on('load', this, function(assetData) {
            this.emit(successEvent, tools.mixin(data, assetData));
          })
          .on('error', this, function(err) {
            data.err = err;
            this.emit(errorEvent, data);
          })
          .load();
      } else {
        throw new Error('Type not found in AssetController.handlers: ' + displayObjectType);
      }
    }

  };

  tools.mixin(AssetController.prototype, EventEmitter);

  return AssetController;
});
