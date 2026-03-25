"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors}
          dotSize={dotSize ?? 3}
          opacities={opacities}
          shader={`${reverse ? "u_reverse_active" : "false"}_; animation_speed_factor_${animationSpeed.toFixed(1)}_;`}
          center={["x", "y"]}
        />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }

    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
            ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({ source, uniforms }: { source: string; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const preparedUniforms = useMemo(() => {
    const preparedUniforms: Record<string, { value: unknown; type?: string }> = {};

    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
            type: "3fv",
          };
          break;
        default:
          break;
      }
    }

    preparedUniforms.u_time = { value: 0, type: "1f" };
    preparedUniforms.u_resolution = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return preparedUniforms;
  }, [uniforms, size.width, size.height]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        gl_Position = vec4(position.x, position.y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
        fragmentShader: source,
        uniforms: preparedUniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    [preparedUniforms, source],
  );

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} />
    </Canvas>
  );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a href={href} className="group relative inline-block h-5 overflow-hidden text-sm text-gray-300">
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span>{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </a>
  );
};

function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinksData = [
    { label: "Manifesto", href: "#1" },
    { label: "Careers", href: "#2" },
    { label: "Discover", href: "#3" },
  ];

  return (
    <header
      className={`fixed left-1/2 top-6 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center border border-[#333] bg-[#1f1f1f57] px-6 py-3 backdrop-blur-sm transition-[border-radius] sm:w-auto ${isOpen ? "rounded-xl" : "rounded-full"}`}
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-8">
        <div className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-200 opacity-80" />
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gray-200 opacity-80" />
          <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gray-200 opacity-80" />
          <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-200 opacity-80" />
        </div>

        <nav className="hidden items-center space-x-6 sm:flex">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <button className="sm:hidden" onClick={() => setIsOpen((prev) => !prev)} aria-label={isOpen ? "Close Menu" : "Open Menu"}>
          <span className="text-gray-300">☰</span>
        </button>
      </div>
    </header>
  );
}

export const SignInPage = ({ className }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("code");
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => codeInputRefs.current[0]?.focus(), 500);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) codeInputRefs.current[index + 1]?.focus();

    if (index === 5 && value && newCode.every((digit) => digit.length === 1)) {
      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);
      setTimeout(() => setStep("success"), 2000);
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("relative flex min-h-[580px] w-full flex-col overflow-hidden rounded-xl bg-black", className)}>
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible ? (
          <CanvasRevealEffect animationSpeed={3} containerClassName="bg-black" colors={[[255, 255, 255], [255, 255, 255]]} dotSize={6} reverse={false} />
        ) : null}
        {reverseCanvasVisible ? (
          <CanvasRevealEffect animationSpeed={4} containerClassName="bg-black" colors={[[255, 255, 255], [255, 255, 255]]} dotSize={6} reverse />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        <MiniNavbar />
        <div className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome Developer</h1>
                    <p className="text-[1.8rem] font-light text-white/70">Your sign in component</p>
                  </div>

                  <form onSubmit={handleEmailSubmit}>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="info@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-full border border-white/10 px-4 py-3 text-center text-white"
                        required
                      />
                      <button type="submit" className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-white/10 text-white">
                        →
                      </button>
                    </div>
                  </form>

                  <p className="pt-10 text-xs text-white/40">
                    By signing up, you agree to the{" "}
                    <Link href="#" className="underline">Privacy Notice</Link>.
                  </p>
                </motion.div>
              ) : step === "code" ? (
                <motion.div
                  key="code-step"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">We sent you a code</h1>
                    <p className="text-[1.25rem] font-light text-white/50">Please enter it</p>
                  </div>

                  <div className="rounded-full border border-white/10 px-5 py-4">
                    <div className="flex items-center justify-center">
                      {code.map((digit, i) => (
                        <div key={i} className="flex items-center">
                          <input
                            ref={(el) => {
                              codeInputRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            className="w-8 bg-transparent text-center text-xl text-white"
                            style={{ caretColor: "transparent" }}
                          />
                          {i < 5 ? <span className="text-xl text-white/20">|</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleBackClick} className="w-[30%] rounded-full bg-white px-8 py-3 font-medium text-black">
                      Back
                    </button>
                    <button
                      className={`flex-1 rounded-full py-3 font-medium ${
                        code.every((d) => d !== "") ? "bg-white text-black" : "cursor-not-allowed border border-white/10 bg-[#111] text-white/50"
                      }`}
                      disabled={!code.every((d) => d !== "")}
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-1">
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">You&apos;re in!</h1>
                    <p className="text-[1.25rem] font-light text-white/50">Welcome</p>
                  </div>
                  <button className="w-full rounded-full bg-white py-3 font-medium text-black">Continue to Dashboard</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
