(function() {
  // 检查是否减少动画
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // 创建 canvas 元素
  var canvas = document.createElement('canvas');
  canvas.id = 'champagne-canvas';
  var ctx = canvas.getContext('2d');
  
  // 设置 canvas 样式 - 绝对定位在 profile 区域
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;border-radius:8px;';
  
  // 找到 profile 容器并插入 canvas
  var profileContainer = document.querySelector('.profile');
  if (!profileContainer) return;
  
  // 设置 profile 为相对定位
  profileContainer.style.position = 'relative';
  profileContainer.style.overflow = 'hidden';
  profileContainer.insertBefore(canvas, profileContainer.firstChild);
  
  // 确保内容在 canvas 之上
  var profileContent = profileContainer.querySelector('.post-content');
  if (profileContent) profileContent.style.position = 'relative';
  var profileImage = profileContainer.querySelector('.profile-image');
  if (profileImage) profileImage.style.position = 'relative';
  
  var _pad = 1;
  var width, height, dpr;
  
  function resize() {
    var rect = profileContainer.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  // 可调参数
  var BUBBLE_RATE = 2;       // 降低气泡产生率
  var RISE_SPEED = 1.2;      // 稍微降低上升速度
  
  // 气泡池
  var bubbles = [];
  var sparkles = [];
  var MAX_BUBBLES = 300;     // 减少最大气泡数
  var MAX_SPARKLES = 50;
  
  // 成核位点
  var nucleationSites = [];
  var NUM_SITES = 8;
  
  function initNucleationSites() {
    nucleationSites = [];
    for (var i = 0; i < NUM_SITES; i++) {
      nucleationSites.push({
        x: width * 0.1 + (width * 0.8) * (i / (NUM_SITES - 1)) + (Math.random() - 0.5) * 30,
        jitter: Math.random() * 15
      });
    }
  }
  initNucleationSites();
  window.addEventListener('resize', initNucleationSites);
  
  function spawnBubble() {
    if (bubbles.length >= MAX_BUBBLES) return;
    
    var x;
    if (Math.random() < 0.7) {
      var site = nucleationSites[Math.floor(Math.random() * nucleationSites.length)];
      x = site.x + (Math.random() - 0.5) * site.jitter;
    } else {
      x = Math.random() * width;
    }
    
    var sizeRoll = Math.random();
    var radius;
    if (sizeRoll < 0.55) {
      radius = 0.8 + Math.random() * 1.5;
    } else if (sizeRoll < 0.85) {
      radius = 2 + Math.random() * 2;
    } else if (sizeRoll < 0.96) {
      radius = 4 + Math.random() * 2.5;
    } else {
      radius = 6 + Math.random() * 3;
    }
    radius *= _pad;
    
    bubbles.push({
      x: x,
      y: height + radius,
      radius: radius,
      baseRadius: radius,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleFreq: 1.5 + Math.random() * 1.5,
      wobbleAmp: (0.3 + Math.random() * 0.7) * radius,
      speedMult: 0.7 + Math.random() * 0.6,
      opacity: 0.25 + Math.random() * 0.35,
      highlightAngle: -0.6 + Math.random() * 0.3,
      age: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseRate: 2 + Math.random() * 2
    });
  }
  
  function spawnSparkle(x, y, bubbleRadius) {
    var count = Math.floor(2 + bubbleRadius * 0.5);
    if (count > 6) count = 6;
    for (var i = 0; i < count; i++) {
      if (sparkles.length >= MAX_SPARKLES) return;
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      var speed = 0.5 + Math.random() * 1.5 + bubbleRadius * 0.1;
      sparkles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 0.5 + Math.random() * 1 + bubbleRadius * 0.08
      });
    }
  }
  
  function getSurfaceY() {
    return height * 0.02;
  }
  
  function updateBubbles(dt) {
    var surfaceY = getSurfaceY();
    var i = bubbles.length;
    while (i--) {
      var b = bubbles[i];
      b.age += dt;
      
      var sizeSpeedFactor = 0.6 + 0.4 * Math.min(b.baseRadius / (8 * _pad), 1);
      var riseAmount = RISE_SPEED * b.speedMult * sizeSpeedFactor * dt * 60;
      b.y -= riseAmount;
      
      b.wobblePhase += b.wobbleFreq * dt;
      b.x += Math.sin(b.wobblePhase) * b.wobbleAmp * dt * 2;
      
      b.radius = b.baseRadius * (1 + 0.05 * Math.sin(b.age * b.pulseRate));
      var heightFraction = 1 - (b.y / height);
      b.radius *= 1 + heightFraction * 0.15;
      
      if (b.y - b.radius <= surfaceY) {
        spawnSparkle(b.x, surfaceY, b.baseRadius);
        bubbles.splice(i, 1);
        continue;
      }
      
      if (b.x < -50 || b.x > width + 50) {
        bubbles.splice(i, 1);
      }
    }
  }
  
  function updateSparkles(dt) {
    var i = sparkles.length;
    while (i--) {
      var s = sparkles[i];
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.vy += 0.02 * dt * 60;
      s.life -= s.decay * dt * 60;
      if (s.life <= 0) {
        sparkles.splice(i, 1);
      }
    }
  }
  
  function drawBubble(b) {
    var r = b.radius;
    if (r < 0.5) return;
    var x = b.x;
    var y = b.y;
    var fadeIn = Math.min(b.age * 3, 1);
    
    // 主体 - 粉色
    var bodyAlpha = b.opacity * 0.25 * fadeIn;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 182, 193, ' + bodyAlpha + ')';
    ctx.fill();
    
    // 边缘 - 深粉色
    var rimAlpha = b.opacity * 0.4 * fadeIn;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 105, 180, ' + rimAlpha + ')';
    ctx.lineWidth = Math.max(0.5, r * 0.08);
    ctx.stroke();
    
    // 高光
    if (r > 1.5) {
      var hlR = r * 0.65;
      var hlX = x - r * 0.25;
      var hlY = y - r * 0.25;
      var hlAlpha = b.opacity * 0.5 * fadeIn;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
      ctx.clip();
      var hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
      hlGrad.addColorStop(0, 'rgba(255, 240, 245, ' + hlAlpha * 0.9 + ')');
      hlGrad.addColorStop(0.3, 'rgba(255, 192, 203, ' + hlAlpha * 0.5 + ')');
      hlGrad.addColorStop(0.7, 'rgba(255, 160, 180, ' + hlAlpha * 0.1 + ')');
      hlGrad.addColorStop(1, 'rgba(255, 160, 180, 0)');
      ctx.fillStyle = hlGrad;
      ctx.beginPath();
      ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      if (r > 3) {
        var specAlpha = b.opacity * 0.7 * fadeIn;
        var specX = x - r * 0.3;
        var specY = y - r * 0.35;
        var specR = Math.max(0.8, r * 0.12);
        ctx.beginPath();
        ctx.arc(specX, specY, specR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 250, 250, ' + specAlpha + ')';
        ctx.fill();
      }
    }
  }
  
  function drawSparkles() {
    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      var alpha = s.life * 0.9;
      var size = s.size * s.life;
      
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = alpha;
      
      var glowR = size * 3;
      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      glow.addColorStop(0, 'rgba(255, 220, 230, 0.8)');
      glow.addColorStop(0.3, 'rgba(255, 182, 193, 0.3)');
      glow.addColorStop(1, 'rgba(255, 105, 180, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 250, 235, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.3, size * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  
  function drawSurface(time) {
    var surfaceY = getSurfaceY();
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    for (var x = 0; x <= width; x += 4) {
      var wave = Math.sin(x * 0.01 + time * 1.2) * 1 + Math.sin(x * 0.025 + time * 0.8) * 0.5 + Math.sin(x * 0.005 + time * 0.5) * 1.5;
      ctx.lineTo(x, surfaceY + wave);
    }
    ctx.strokeStyle = 'rgba(255, 182, 193, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 动画状态
  var lastTime = 0;
  var spawnAccumulator = 0;
  
  function render(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    if (prefersReduced) dt = 0;
    
    ctx.clearRect(0, 0, width, height);
    
    var time = timestamp / 1000;
    
    spawnAccumulator += BUBBLE_RATE * dt * 60;
    while (spawnAccumulator >= 1) {
      spawnBubble();
      spawnAccumulator -= 1;
    }
    
    updateBubbles(dt);
    updateSparkles(dt);
    
    bubbles.sort(function(a, b) { return b.radius - a.radius; });
    for (var i = 0; i < bubbles.length; i++) {
      drawBubble(bubbles[i]);
    }
    drawSparkles();
    drawSurface(time);
    
    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
})();
