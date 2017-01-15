
export default class Timer  {

    constructor(time, scene, callback) {
        this.maxTime = this.currentTime = time;
        this.isOver = false;
        this.started = false;
        this.callback = callback;

        this.scene = scene; // needed in _update

        this._update = this._update.bind(this)

        var _this = this;
        scene.registerBeforeRender(function() {
            if (_this.started && !_this.isOver) {
                _this._update();
            }
        });
    };

    reset = function() {
        this.currentTime = this.maxTime;
        this.isOver = false;
        this.started = false;
    };

    start = function() {
        this.started = true;
    };

    _update = function() {
        // 2.0 breaking changes: Tools.GetFps() and Tools.GetDeltaTime() are now functions hosted by the engine
        this.currentTime -= this.scene.getEngine().getDeltaTime();
        if (this.currentTime <= 0) {
            this.isOver = true;
            this.callback();
        }
    };
}