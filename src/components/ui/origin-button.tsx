import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Paleta original vinha condicionada a dark:[...] (variant de classe .dark
// no <html>), mas esse app é sempre escuro via CSS próprio, sem essa classe
// — então os valores "dark" nunca ativavam e o botão saía com fundo branco.
// Aqui os valores escuros viram o padrão direto, sem depender do variant.
const componentThemeClassName =
  '[--ic-background:#111111] [--ic-foreground:#f6f3ec] [--ic-primary:#f6f3ec] [--ic-secondary:#cbc6bb] [--ic-surface-border:#2a2a25] [--ic-border:#2b2a25] [--ic-card:#111111] [--ic-card-foreground:#f6f3ec] [--ic-muted:#171716] [--ic-muted-foreground:#9a958a] [--ic-accent:#1a1a18] [--ic-accent-foreground:#f6f3ec] [--ic-input:#2b2a25] [--ic-ring:rgba(246,243,236,0.18)] [--ic-destructive:#f87171] [--ic-paper:#171716] [--ic-popover-foreground:#f6f3ec] [--ic-brand:#38bdf8] [--ic-brand-soft:#0c4a6e] [--ic-shadow-soft:0_20px_44px_-28px_rgba(0,0,0,0.6)] [--ic-chart-1:oklch(0.68_0.17_250)] [--ic-chart-2:oklch(0.82_0.09_225)] [--ic-chart-3:oklch(0.58_0.15_260)] [--ic-chart-4:oklch(0.75_0.12_235)] [--ic-chart-5:oklch(0.88_0.06_220)] [--color-background:var(--ic-background)] [--color-foreground:var(--ic-foreground)] [--color-primary:var(--ic-primary)] [--color-secondary:var(--ic-secondary)] [--color-border:var(--ic-border)] [--color-card:var(--ic-card)] [--color-card-foreground:var(--ic-card-foreground)] [--color-muted:var(--ic-muted)] [--color-muted-foreground:var(--ic-muted-foreground)] [--color-accent:var(--ic-accent)] [--color-accent-foreground:var(--ic-accent-foreground)] [--color-input:var(--ic-input)] [--color-ring:var(--ic-ring)] [--color-destructive:var(--ic-destructive)] [--color-paper:var(--ic-paper)] [--color-popover-foreground:var(--ic-popover-foreground)] [--color-brand:var(--ic-brand)] [--color-brand-soft:var(--ic-brand-soft)] [--color-chart-1:var(--ic-chart-1)] [--color-chart-2:var(--ic-chart-2)] [--color-chart-3:var(--ic-chart-3)] [--color-chart-4:var(--ic-chart-4)] [--color-chart-5:var(--ic-chart-5)]';

const FILL_DURATION = 0.5;
const FILL_EASE = [0.16, 1, 0.3, 1] as const;

type ButtonHTMLAttributesForMotion = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onAnimationStart'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDragStart'
  | 'onDrop'
>;

function getCoverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y),
      ),
  );
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function hasTextContent(node: React.ReactNode): boolean {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node).trim().length > 0;
  }

  if (Array.isArray(node)) {
    return node.some(hasTextContent);
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return hasTextContent(node.props.children);
  }

  return false;
}

type OriginButtonProps = ButtonHTMLAttributesForMotion & {
  children?: React.ReactNode;
  loading?: boolean;
  /** Mantém apenas o preenchimento animado, preservando o CSS do botão consumidor. */
  effectOnly?: boolean;
  // Mantém o preenchimento aberto mesmo sem hover/pressionar — pra botões de
  // alternar/selecionar (ex.: chip de mês ou filtro "ativo"), que precisam
  // continuar preenchidos depois de clicados, não só durante o hover.
  active?: boolean;
};

const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(
  (
    {
      active = false,
      children,
      className,
      disabled = false,
      effectOnly = false,
      loading = false,
      type = 'button',
      onBlur,
      onClick,
      onFocus,
      onKeyDown,
      onKeyUp,
      onPointerCancel,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
      ...props
    },
    ref,
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const isDisabled = Boolean(disabled || loading);
    const [hovered, setHovered] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);
    const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
    const [coverSize, setCoverSize] = React.useState(0);

    const ariaLabel = props['aria-label'];
    const ariaLabelledBy = props['aria-labelledby'];

    React.useEffect(() => {
      // process.env.NODE_ENV não existe no navegador com Vite (isso é Next.js
      // API) — o equivalente aqui é import.meta.env.PROD.
      if (import.meta.env.PROD) {
        return;
      }

      if (hasTextContent(children) || ariaLabel?.trim() || ariaLabelledBy?.trim()) {
        return;
      }

      console.warn(
        'OriginButton: provide visible label text or aria-label / aria-labelledby so the control has an accessible name.',
      );
    }, [ariaLabel, ariaLabelledBy, children]);

    const updateOrigin = React.useCallback((x: number, y: number) => {
      const node = buttonRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      setOrigin({ x, y });
      setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
    }, []);

    const updateOriginFromPointer = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
      },
      [updateOrigin],
    );

    const updateOriginFromCenter = React.useCallback(() => {
      const node = buttonRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      updateOrigin(rect.width / 2, rect.height / 2);
    }, [updateOrigin]);

    const showFill = !isDisabled && (active || hovered || isPressed);

    // Quando "active" liga sem hover algum (ex.: já nasce selecionado, ou
    // fica selecionado por clique em outro lugar), a origem some do centro
    // em vez de ficar travada em (0,0). Um hover real depois disso assume o
    // controle normalmente (o handler de pointer atualiza origin de novo).
    React.useEffect(() => {
      if (active) updateOriginFromCenter();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    React.useLayoutEffect(() => {
      const node = buttonRef.current;
      if (!(node && showFill)) return;

      const measure = () => {
        const rect = node.getBoundingClientRect();
        setCoverSize(getCoverDiameter(rect.width, rect.height, origin.x, origin.y));
      };

      measure();

      const observer = new ResizeObserver(measure);
      observer.observe(node);

      const fonts = document.fonts;
      if (fonts?.ready) {
        fonts.ready.then(measure).catch(() => undefined);
      }

      return () => observer.disconnect();
    }, [showFill, origin.x, origin.y]);

    const fillTransition = { duration: FILL_DURATION, ease: FILL_EASE };

    const setMergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    return (
      <motion.button
        {...props}
        aria-busy={loading || undefined}
        className={cn(
          componentThemeClassName,
          'relative cursor-pointer touch-manipulation select-none overflow-hidden transition-[color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50',
          !effectOnly && 'inline-flex h-12 items-center justify-center rounded-xl border-[0.5px] border-border bg-muted px-8 font-medium text-[15px] tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          effectOnly && 'origin-button-effect-only',
          showFill && 'text-neutral-950',
          className,
        )}
        data-pressed={isPressed ? 'true' : 'false'}
        data-filled={showFill ? 'true' : 'false'}
        disabled={isDisabled}
        onBlur={(event) => {
          onBlur?.(event);
          setIsPressed(false);
          if (!event.defaultPrevented) {
            setHovered(false);
          }
        }}
        onClick={onClick}
        onFocus={(event) => {
          onFocus?.(event);
          if (isDisabled || event.defaultPrevented) return;
          if (event.currentTarget.matches(':focus-visible')) {
            updateOriginFromCenter();
            setHovered(true);
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (event.defaultPrevented || isDisabled || event.repeat || (event.key !== ' ' && event.key !== 'Enter')) {
            return;
          }

          if (event.key === ' ') {
            event.preventDefault();
          }

          updateOriginFromCenter();
          setIsPressed(true);
          setHovered(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);

          if (event.key === ' ' || event.key === 'Enter') {
            setIsPressed(false);
            if (!event.currentTarget.matches(':focus-visible')) {
              setHovered(false);
            }
          }
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          setIsPressed(false);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);

          if (event.defaultPrevented || isDisabled || event.button !== 0) {
            return;
          }

          updateOriginFromPointer(event);
          setIsPressed(true);
          setHovered(true);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (isDisabled || event.defaultPrevented) return;
          updateOriginFromPointer(event);
          setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          setHovered(false);
          setIsPressed(false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          setIsPressed(false);
        }}
        ref={setMergedRef}
        type={type}
        whileTap={isDisabled ? undefined : { scale: 0.985 }}
      >
        <motion.span
          animate={{ scale: showFill && coverSize > 0 ? 1 : 0 }}
          aria-hidden
          // bg-[var(--ic-foreground)] em vez de bg-foreground: esse app usa
          // @theme inline no Tailwind, que GRAVA o valor final da cor direto
          // no CSS gerado pra utilities semânticas (bg-foreground vira um
          // hex fixo, não var(--color-foreground)) — então uma sobrescrita
          // local de --ic-foreground por instância nunca era lida. Valor
          // arbitrário (bg-[var(...)]) sempre preserva a referência viva.
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ic-foreground)]"
          initial={false}
          style={{
            height: coverSize,
            left: origin.x,
            top: origin.y,
            width: coverSize,
          }}
          transition={fillTransition}
        />
        <span className="origin-button-content relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      </motion.button>
    );
  },
);
OriginButton.displayName = 'OriginButton';

export { OriginButton };
export type { OriginButtonProps };
