"use client";

import { useEffect, useReducer } from "react";

interface TerminalState {
  command: string;
  commandCharIndex: number;
  outputLines: string[];
  isTyping: boolean;
}

type TerminalAction =
  | { type: "TYPE_CHAR" }
  | { type: "FINISH_COMMAND" }
  | { type: "ADD_OUTPUT"; payload: string }
  | { type: "RESET" };

const terminalReducer = (state: TerminalState, action: TerminalAction): TerminalState => {
  switch (action.type) {
    case "TYPE_CHAR":
      return {
        ...state,
        commandCharIndex: Math.min(state.commandCharIndex + 1, state.command.length),
      };
    case "FINISH_COMMAND":
      return { ...state, isTyping: false };
    case "ADD_OUTPUT":
      return {
        ...state,
        outputLines: [...state.outputLines, action.payload],
      };
    case "RESET":
      return {
        command: "python3 vulnscope.py --target dvwa --run-all --report",
        commandCharIndex: 0,
        outputLines: [],
        isTyping: true,
      };
    default:
      return state;
  }
};

const OUTPUT_LINES = [
  "[*] Starting Nmap scan on 192.168.56.101...",
  "[*] Running Nikto web scanner...",
  "[*] SQLMap injection tests in progress...",
  "[+] Parsing and classifying outputs...",
  "[✓] Report saved: vulnscope_report.pdf",
];

export default function TerminalDemo() {
  const [state, dispatch] = useReducer(terminalReducer, {
    command: "python3 vulnscope.py --target dvwa --run-all --report",
    commandCharIndex: 0,
    outputLines: [],
    isTyping: true,
  });

  useEffect(() => {
    if (state.commandCharIndex < state.command.length) {
      const timer = setTimeout(() => {
        dispatch({ type: "TYPE_CHAR" });
      }, 40);
      return () => clearTimeout(timer);
    }

    if (state.isTyping && state.commandCharIndex === state.command.length) {
      const timer = setTimeout(() => {
        dispatch({ type: "FINISH_COMMAND" });
      }, 600);
      return () => clearTimeout(timer);
    }

    if (!state.isTyping && state.outputLines.length < OUTPUT_LINES.length) {
      const timer = setTimeout(() => {
        dispatch({ type: "ADD_OUTPUT", payload: OUTPUT_LINES[state.outputLines.length] });
      }, 300);
      return () => clearTimeout(timer);
    }

    if (!state.isTyping && state.outputLines.length === OUTPUT_LINES.length) {
      const timer = setTimeout(() => {
        dispatch({ type: "RESET" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const colors = {
    muted: "text-muted",
    amber: "text-amber",
    green: "#28C840",
  };

  return (
    <div
      className="bg-[#050709] border border-slate-600 rounded overflow-hidden"
      aria-label="Animated terminal demo"
      aria-live="polite"
    >
      {/* Terminal Header */}
      <div className="bg-surface px-4 py-3 flex items-center gap-2 border-b border-slate-600">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full" style={{ background: colors.green }} />
        </div>
        <span className="font-mono text-xs text-dimtext mx-auto">kali@vulnscope:~$</span>
        <div className="w-12" />
      </div>

      {/* Terminal Body */}
      <div className="p-4 min-h-35 font-mono text-sm space-y-1">
        <div>
          <span className="text-amber">$</span>{" "}
          <span className="text-primary">{state.command.slice(0, state.commandCharIndex)}</span>
          {state.isTyping && <span className="text-amber animate-blink">▊</span>}
        </div>

        {state.outputLines.map((line, i) => (
          <div
            key={i}
            className={`${
              line.includes("[✓]")
                ? "text-green-500"
                : line.includes("[+]")
                  ? colors.amber
                  : colors.muted
            }`}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
