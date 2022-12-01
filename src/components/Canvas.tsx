import { useEffect, useRef, useState } from "react";

interface TypeCoords {
  x: number,
  y: number,
}

interface TypeLine {
  start: TypeCoords,
  end: TypeCoords,
}

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [lines, setLines] = useState<TypeLine[]>([]);
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [isCollapsingLines, setIsCollapsingLines] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.oncontextmenu = e => e.preventDefault();
  
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d'); 
    
    if (!context) {
      return;
    }

    context.lineCap = 'round';
    context.lineWidth = 2;
    contextRef.current = context;
  }, [])

  useEffect(() => {
    if (!contextRef.current || !canvasRef.current) {
      return;
    }

    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (!lines.length) {
      return;
    }
    
    contextRef.current.beginPath();
    contextRef.current.strokeStyle = 'black';

    lines.forEach(({ start, end}) => {
      contextRef.current?.moveTo(start.x, start.y);
      contextRef.current?.lineTo(end.x, end.y);
    })
    
    contextRef.current.closePath();
    contextRef.current.stroke();

    for (let i = 0; i < lines.length - 1; i++) {
      const a1 = lines[i].end.y - lines[i].start.y;
      const b1 = lines[i].start.x - lines[i].end.x;
      const c1 = -lines[i].start.x * lines[i].end.y + lines[i].start.y * lines[i].end.x;
      for (let j = i + 1; j < lines.length; j++) {
        const a2 = lines[j].end.y - lines[j].start.y;
        const b2 = lines[j].start.x - lines[j].end.x;
        const c2 = -lines[j].start.x * lines[j].end.y + lines[j].start.y * lines[j].end.x; 

        const crossX = Math.floor((b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1));
        const crossY = Math.floor((a2 * c1 - a1 * c2) / (a1 * b2 - a2 * b1));

        const x1 = lines[i].end.x > lines[i].start.x ? lines[i].start.x : lines[i].end.x;
        const x2 = lines[i].end.x < lines[i].start.x ? lines[i].start.x : lines[i].end.x;
        const y1 = lines[i].end.y > lines[i].start.y ? lines[i].start.y : lines[i].end.y;
        const y2 = lines[i].end.y < lines[i].start.y ? lines[i].start.y : lines[i].end.y;

        const x1_ = lines[j].end.x > lines[j].start.x ? lines[j].start.x : lines[j].end.x;
        const x2_ = lines[j].end.x < lines[j].start.x ? lines[j].start.x : lines[j].end.x;
        const y1_ = lines[j].end.y > lines[j].start.y ? lines[j].start.y : lines[j].end.y;
        const y2_ = lines[j].end.y < lines[j].start.y ? lines[j].start.y : lines[j].end.y;

        if (crossX >= x1 && crossX <= x2 && crossX >= x1_ && crossX <= x2_ &&
          crossY >= y1 && crossY <= y2 && crossY >= y1_ && crossY <= y2_) {
          contextRef.current.beginPath();
          contextRef.current.strokeStyle = 'black';
          contextRef.current.fillStyle = 'red';
          contextRef.current.arc(crossX, crossY, 6, 0, Math.PI * 2, false);
          contextRef.current.fill();
          contextRef.current.stroke();
        }
      }
    }
  }, [lines])

  const startDrawingLine = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isCollapsingLines) {
      return;
    }
    
    const {offsetX, offsetY} = event.nativeEvent;
    const newLine: TypeLine = {
      start: {
        x: offsetX,
        y: offsetY,
      },
      end: {
        x: offsetX,
        y: offsetY,        
      }
    }
    
    setIsDrawingLine(true);
    setLines(prev => [...prev, newLine]);
  };

  const finishDrawingLine = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isCollapsingLines || !isDrawingLine) {
      return;
    }

    const {offsetX, offsetY} = event.nativeEvent;

    setIsDrawingLine(false);
    setLines(prev => {
        prev[prev.length - 1].end.x = offsetX;
        prev[prev.length - 1].end.y = offsetY;   
        return [...prev];     
      });
  }

  const handleDrawingLine = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!event.button) {
      if (!isDrawingLine) {
        startDrawingLine(event);
      } else {
        finishDrawingLine(event);
      }
    } else if (event.button === 2 && isDrawingLine) {
      setLines(prev => prev.slice(0, -1));
      setIsDrawingLine(false);
    }
  }

  const drawLine = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isCollapsingLines) {
      return;
    }

    const {offsetX, offsetY} = event.nativeEvent;

    if (!contextRef.current || !isDrawingLine) {
      return;
    }

    setLines(prev => {
      prev[prev.length - 1].end.x = offsetX;
      prev[prev.length - 1].end.y = offsetY;   
      return [...prev];    
    });
  }

  const handleCollapseLines = () => {
    if (isCollapsingLines || !lines.length) {
      return;
    }
    
    const timeLine = 5000;
    const smoothness = 250;
    const lin = [...lines].map(({end, start}) => ({end: {...end}, start:{...start}}));
    let loop = 1;
    let timer: number;
      
    setIsCollapsingLines(true)
    
    const collapseLines = () => {
      for (let i = 0; i < lines.length; i++) {
        const x1x2 = Math.abs(lin[i].end.x - lin[i].start.x);
        const y1y2 = Math.abs(lin[i].end.y - lin[i].start.y);
        const a = lin[i].end.y - lin[i].start.y;
        const b = lin[i].start.x - lin[i].end.x;
        const c = -lin[i].start.x * lin[i].end.y + lin[i].start.y * lin[i].end.x;

        if (x1x2 > y1y2) {
          if (lin[i].end.x > lin[i].start.x) {
            lines[i].end.x = lin[i].end.x - x1x2 / smoothness * loop;
            lines[i].start.x = lin[i].start.x + x1x2 / smoothness * loop;
          } else {
            lines[i].start.x = lin[i].start.x - x1x2 / smoothness * loop;
            lines[i].end.x = lin[i].end.x + x1x2 / smoothness * loop;
          }

          lines[i].end.y = (- a * lines[i].end.x - c) / b;
          lines[i].start.y = (- a * lines[i].start.x - c) / b;
        } else {
          if (lin[i].end.y > lin[i].start.y) {
            lines[i].end.y = lin[i].end.y - y1y2 / smoothness * loop;
            lines[i].start.y = lin[i].start.y + y1y2 / smoothness * loop;
          } else {
            lines[i].start.y = lin[i].start.y - y1y2 / smoothness * loop;
            lines[i].end.y = lin[i].end.y + y1y2 / smoothness * loop;
          }          

          lines[i].end.x = (- b * lines[i].end.y - c) / a;
          lines[i].start.x = (- b * lines[i].start.y - c) / a;
        }
      }

      loop++;

      setLines([...lines]);

      if (loop >= smoothness / 2) {
        window.clearInterval(timer);
        setLines([]);
        setIsCollapsingLines(false);
      }
    }

    timer = window.setInterval(collapseLines, Math.round(timeLine / smoothness));
  }

  return (
    <div>
      <canvas 
        className="canvas"
        width={window.innerWidth - 80}
        height={window.innerHeight - 170}
        onMouseDown={handleDrawingLine}
        onMouseMove={drawLine}
        ref={canvasRef}
      />

      <button 
        className="button"
        onClick={handleCollapseLines}
      >
        Collapse lines
      </button>
    </div> 
  )
}