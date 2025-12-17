import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// --- Lenis Smooth Scroll ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: "vertical",
  gestureDirection: "vertical",
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// --- Shared Mouse Tracker ---
const mouse = { x: -1000, y: -1000 }; // Default off-screen
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// --- Canvas System ---
class AbstractCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.animationId = null;
    this.isVisible = false;

    // shared config
    this.neonPurple = "rgba(176, 38, 255, 0.4)";
    this.neonBlue = "rgba(78, 205, 196, 0.4)";

    this.init();

    // Observer for performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.isVisible = true;
            this.start();
          } else {
            this.isVisible = false;
            this.stop();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(this.canvas.parentElement); // Observe section

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.onResize && this.onResize();
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate() {
    if (!this.isVisible) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.draw && this.draw();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  init() {}
}

// 1. Hero Canvas (Maintained/Updated)
class HeroCanvas extends AbstractCanvas {
  init() {
    this.particles = [];
    this.count = 80;
    for (let i = 0; i < this.count; i++)
      this.particles.push(this.createParticle());
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 2 + 1,
    };
  }

  draw() {
    this.ctx.fillStyle = "rgba(26, 26, 26, 0.6)";
    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.neonBlue;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    });
  }
}

// 2. About Canvas: Repulsive Grid
class AboutCanvas extends AbstractCanvas {
  init() {
    this.dots = [];
    this.spacing = 50;
    this.createDots();
  }

  onResize() {
    this.createDots();
  }

  createDots() {
    this.dots = [];
    for (let x = 0; x < this.width; x += this.spacing) {
      for (let y = 0; y < this.height; y += this.spacing) {
        this.dots.push({ originX: x, originY: y, x: x, y: y });
      }
    }
  }

  draw() {
    this.ctx.fillStyle = this.neonPurple;
    this.dots.forEach((dot) => {
      const dx = mouse.x - dot.x; // Use relative to canvas if needed, but absolute is fine for full screen
      const dy = mouse.y - (dot.y + this.canvas.getBoundingClientRect().top); // Adjust for scroll
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = Math.max(0, 150 - dist) / 150;

      const angle = Math.atan2(dy, dx);
      const move = force * 40;

      dot.x += (dot.originX - Math.cos(angle) * move - dot.x) * 0.1;
      dot.y += (dot.originY - Math.sin(angle) * move - dot.y) * 0.1;

      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

// 3. Skills Canvas: Floating Shapes
class SkillsCanvas extends AbstractCanvas {
  init() {
    this.shapes = [];
    for (let i = 0; i < 15; i++) {
      this.shapes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 30 + 10,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        type: Math.random() > 0.5 ? "square" : "triangle",
      });
    }
  }

  draw() {
    this.ctx.strokeStyle = this.neonPurple;
    this.ctx.lineWidth = 1.5;

    this.shapes.forEach((shape) => {
      shape.y -= shape.speed;
      shape.angle += shape.rotSpeed;

      // Mouse interaction
      const dy = mouse.y - (shape.y + this.canvas.getBoundingClientRect().top);
      const dx = mouse.x - shape.x;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        shape.x -= dx / dist;
      }

      if (shape.y < -50) shape.y = this.height + 50;

      this.ctx.save();
      this.ctx.translate(shape.x, shape.y);
      this.ctx.rotate(shape.angle);

      this.ctx.beginPath();
      if (shape.type === "square") {
        this.ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
      } else {
        this.ctx.moveTo(0, -shape.size / 2);
        this.ctx.lineTo(shape.size / 2, shape.size / 2);
        this.ctx.lineTo(-shape.size / 2, shape.size / 2);
        this.ctx.closePath();
      }
      this.ctx.stroke();
      this.ctx.restore();
    });
  }
}

// 4. Projects Canvas: Sine Waves
class ProjectsCanvas extends AbstractCanvas {
  init() {
    this.offset = 0;
  }
  draw() {
    this.offset += 0.05;
    this.ctx.strokeStyle = "rgba(176, 38, 255, 0.2)";
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      for (let x = 0; x < this.width; x++) {
        const y =
          this.height / 2 +
          Math.sin(x * 0.01 + this.offset + i) * 50 +
          Math.sin(x * 0.005 + this.offset * 0.5) * 100;
        this.ctx.lineTo(x, y + i * 20);
      }
      this.ctx.stroke();
    }
  }
}

// 5. Contact Canvas: Gravity Particles
class ContactCanvas extends AbstractCanvas {
  init() {
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        friction: 0.95,
      });
    }
  }

  draw() {
    this.ctx.fillStyle = this.neonPurple;
    const rect = this.canvas.getBoundingClientRect();

    this.particles.forEach((p) => {
      const dx = mouse.x - p.x;
      const dy = mouse.y - rect.top - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Attract to mouse if close
      if (dist < 300) {
        p.vx += dx * 0.001;
        p.vy += dy * 0.001;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.friction;
      p.vy *= p.friction;

      // Random movement
      p.x += Math.random() - 0.5;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

// Initialize Canvases
new HeroCanvas("hero-canvas");
new AboutCanvas("canvas-about");
new SkillsCanvas("canvas-skills");
new ProjectsCanvas("canvas-projects");
new ContactCanvas("canvas-contact");

// --- Live Text Animation ---
function splitText() {
  const targets = document.querySelectorAll(".live-text");
  targets.forEach((el) => {
    const text = el.innerText;
    el.innerHTML = text
      .split("")
      .map((char) => {
        return char === " "
          ? "&nbsp;"
          : `<span class="char-span">${char}</span>`;
      })
      .join("");

    // Stagger Reveal
    gsap.to(el.querySelectorAll(".char-span"), {
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.03,
      ease: "back.out(2)",
    });
  });
}

// Run split text setup
splitText();

// --- GSAP Scroll Animations ---

// 1. Hero Text Reveal
const heroTl = gsap.timeline({ delay: 0.5 });
heroTl
  .from(".hero-title", { y: 100, opacity: 0, duration: 1, ease: "power4.out" })
  .from(
    ".hero-subtitle",
    { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" },
    "-=0.5"
  );

// 2. Section Headers Fade Up
gsap.utils.toArray(".center-header, .about-content").forEach((element) => {
  gsap.from(element, {
    scrollTrigger: { trigger: element, start: "top 80%" },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
  });
});

// 3. Parallax Effects
gsap.utils.toArray(".parallax-element").forEach((container) => {
  const target =
    container.querySelector("img") || container.querySelector("div");
  if (target) {
    gsap.to(target, {
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: -50,
      ease: "none",
    });
  }
});

// 4. Skills Stagger Reveal
gsap.from(".skill-card", {
  scrollTrigger: { trigger: ".skills-grid", start: "top 80%" },
  y: 50,
  opacity: 0,
  duration: 0.8,
  stagger: 0.2,
  ease: "back.out(1.7)",
});

// 5. Project Items Slide In
gsap.utils.toArray(".project-item").forEach((item, i) => {
  gsap.from(item, {
    scrollTrigger: { trigger: item, start: "top 85%" },
    x: i % 2 === 0 ? -100 : 100,
    opacity: 0,
    duration: 1,
    ease: "power4.out",
  });
});

// --- Smooth Scroll for Anchor Links ---
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElem = document.querySelector(targetId);
    if (targetElem) {
      lenis.scrollTo(targetElem, {
        offset: 0,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  });
});
