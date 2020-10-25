import React, { useEffect, useRef } from "react";
import { decode } from "blurhash";

interface BlurhashCanvasProps {
  hash: string;
  height?: number;
  punch?: number;
  width?: number;
  rest?: any;
  className?: string;
}

const BlurhashCanvas = ({
  height = 500,
  width = 500,
  className,
  punch,
  hash,
  rest,
}: BlurhashCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = async () => {
    if (canvasRef) {
      const pixels = await decode(hash, width, height, punch);
      const canvas = canvasRef.current as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useEffect(() => {
    draw();
  });

  useEffect(() => {
    canvasRef.current.style.width = "100%";
    canvasRef.current.style.height = "100%";
  }, [draw]);

  return (
    <div className={className}>
      <canvas
        {...rest}
        height={height ? height : "100%"}
        width={width ? width : "100%"}
        ref={canvasRef}
        // className="d-none"
        className="w-100p h-100p obf-cover obp-center"
      />
      {/* <img ref={imgRef} className="w-100p h-100p obf-cover obp-center" /> */}
    </div>
  );
};

export default BlurhashCanvas;
