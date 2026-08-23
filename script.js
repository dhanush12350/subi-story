/* ==========================================================================
   THE STORY I NEVER FINISHED — SUBI
   JavaScript Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Canvas Lavender Particle Engine
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  let mouse = { x: null, y: null };

  function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createParticles();
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 2.5 + 0.5;
      this.baseAlpha = Math.random() * 0.5 + 0.2;
      this.alpha = this.baseAlpha;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -Math.random() * 0.4 - 0.1; // Gentle upward drift
      this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Twinkle effect
      this.twinklePhase += this.twinkleSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.2;

      // Wrap around bounds
      if (this.y < -10) this.y = height + 10;
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;

      // Mouse proximity reaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(163, 130, 214, ${Math.max(0, this.alpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(235, 178, 203, 0.6)';
      ctx.fill();
      ctx.restore();
    }
  }

  function createParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 12000), 75);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => {
    initCanvas();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  initCanvas();
  animateParticles();

  /* --------------------------------------------------------------------------
     2. Ambient Sound Engine (Web Audio Synth Fallback + Audio File)
     -------------------------------------------------------------------------- */
  const musicBtn = document.getElementById('music-btn');
  const musicText = document.getElementById('music-text');
  const bgMusic = document.getElementById('bg-music');
  
  let isPlaying = false;
  let audioCtx = null;
  let synthGain = null;
  let synthInterval = null;

  // Synthesizes a soft, soothing ambient piano chord pad if no external MP3 is provided
  function startAmbientSynth() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    synthGain = audioCtx.createGain();
    synthGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    synthGain.connect(audioCtx.destination);

    // Warm chord frequencies (Eb major / C minor warm frequencies: Eb3, G3, Bb3, C4, G4)
    const chords = [
      [155.56, 196.00, 233.08, 311.13], // Eb maj
      [130.81, 196.00, 233.08, 261.63], // Cm7
      [174.61, 220.00, 261.63, 349.23], // Fm
      [116.54, 174.61, 233.08, 293.66]  // Bb
    ];

    let chordIdx = 0;

    function playChord() {
      if (!isPlaying || !synthGain) return;

      const freqs = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      freqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        // Soft Sine with warm harmonics
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Envelope: slow attack and smooth release
        const now = audioCtx.currentTime;
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.03, now + 2.5);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5);

        osc.connect(noteGain);
        noteGain.connect(synthGain);

        osc.start(now);
        osc.stop(now + 8);
      });
    }

    playChord();
    synthInterval = setInterval(playChord, 7000);
  }

  function stopAmbientSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    if (synthGain && audioCtx) {
      synthGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
      setTimeout(() => {
        synthGain = null;
      }, 1000);
    }
  }

  function startMusic() {
    if (isPlaying) return;
    bgMusic.play().then(() => {
      isPlaying = true;
      musicBtn.classList.add('playing');
      musicText.textContent = 'Music On';
    }).catch(err => {
      console.log('Autoplay deferred or synth fallback:', err);
    });
  }

  function stopMusic() {
    isPlaying = false;
    musicBtn.classList.remove('playing');
    musicText.textContent = 'Play Soundtrack';
    bgMusic.pause();
    stopAmbientSynth();
  }

  function toggleMusic() {
    if (!isPlaying) {
      bgMusic.play().then(() => {
        isPlaying = true;
        musicBtn.classList.add('playing');
        musicText.textContent = 'Music On';
      }).catch(err => {
        console.log('Using Web Audio ambient synth fallback:', err);
        isPlaying = true;
        musicBtn.classList.add('playing');
        musicText.textContent = 'Music On';
        startAmbientSynth();
      });
    } else {
      stopMusic();
    }
  }

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });

  // Autoplay immediately on load
  startMusic();

  // Autoplay fallback on first user interaction (bypasses browser autoplay policy)
  function handleFirstUserInteraction() {
    if (!isPlaying) {
      startMusic();
    }
    window.removeEventListener('click', handleFirstUserInteraction);
    window.removeEventListener('touchstart', handleFirstUserInteraction);
    window.removeEventListener('keydown', handleFirstUserInteraction);
  }

  window.addEventListener('click', handleFirstUserInteraction, { once: true });
  window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });
  window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

  /* --------------------------------------------------------------------------
     3. Smooth Scroll & Button Navigation Controller
     -------------------------------------------------------------------------- */
  const navActionBtns = document.querySelectorAll('.nav-btn-action');
  navActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-target');
      if (targetSelector) {
        const targetSec = document.querySelector(targetSelector);
        if (targetSec) {
          targetSec.scrollIntoView({ behavior: 'smooth' });

          // Instantly trigger reveal animation for target elements
          const reveals = targetSec.querySelectorAll('.reveal-text, .glass-card, .chat-bubble, .timeline-node, .confession-block, .impact-text');
          reveals.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('visible-reveal');
            }, index * 100);
          });
        }
      }
    });
  });

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSec = document.querySelector(targetId);
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* --------------------------------------------------------------------------
     4. Scroll Observer, Active Chapter Indicator & Animation Reveals
     -------------------------------------------------------------------------- */
  const chapters = document.querySelectorAll('.chapter-section');
  const navBar = document.getElementById('nav-bar');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -20% 0px',
    threshold: 0.15
  };

  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        // Update active nav link
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        // Dark nav theme detection for Chapter 07 and Confession
        if (id === 'chapter-07' || id === 'confession') {
          document.body.classList.add('dark-nav-theme');
        } else if (id === 'intro' || id === 'chapter-01' || id === 'chapter-02' || id === 'chapter-03' || id === 'chapter-04' || id === 'chapter-05' || id === 'chapter-06' || id === 'final-screen') {
          document.body.classList.remove('dark-nav-theme');
        }

        // Trigger text & card reveal animations inside the section
        const reveals = entry.target.querySelectorAll('.reveal-text, .glass-card, .chat-bubble, .timeline-node, .confession-block, .impact-text, .respectful-ending-box');
        reveals.forEach((el, index) => {
          setTimeout(() => {
            el.classList.add('visible-reveal');
          }, index * 140);
        });
      }
    });
  }, observerOptions);

  chapters.forEach(chapter => {
    chapterObserver.observe(chapter);
  });

  /* --------------------------------------------------------------------------
     5. Timeline Animation Handler (Chapter 05)
     -------------------------------------------------------------------------- */
  const chapter05 = document.getElementById('chapter-05');
  const progressBar = document.getElementById('timeline-progress-bar');
  const timelineNodes = document.querySelectorAll('.timeline-node');

  function updateTimeline() {
    if (!chapter05 || !progressBar) return;

    const rect = chapter05.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.top <= windowHeight && rect.bottom >= 0) {
      // Calculate scroll ratio inside chapter 05
      const totalDist = rect.height + windowHeight;
      const currentDist = windowHeight - rect.top;
      let progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
      
      // Scale progress line smoothly
      const progressPercent = Math.min(progress * 130, 100);
      progressBar.style.width = `${progressPercent}%`;
      progressBar.style.height = `${progressPercent}%`;

      // Activate nodes step-by-step
      const activeCount = Math.ceil((progressPercent / 100) * timelineNodes.length);
      timelineNodes.forEach((node, idx) => {
        if (idx < activeCount) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      });
    }
  }

  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline();

});
