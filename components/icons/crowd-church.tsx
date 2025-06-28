import React from 'react';

interface CrowdChurchProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CrowdChurch({ width = 683, height = 224, className = '' }: CrowdChurchProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 683 224"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: 2
      }}
    >
      <g transform="matrix(0.466574,0,0,0.466574,-202.104,-1034.57)">
        <text
          x="417"
          y="2509"
          style={{
            fontFamily: "'SFCompactDisplay-Bold', 'SF Compact Display', sans-serif",
            fontWeight: 700,
            fontSize: '429.982px',
            fill: 'white'
          }}
        >
          CROWD
        </text>
      </g>
      <g transform="matrix(0.797152,0,0,0.797152,-337.746,-1777.53)">
        <text
          x="417"
          y="2509"
          style={{
            fontFamily: "'SFCompactText-Light', 'SF Compact Text'",
            fontSize: '95.829px',
            fill: 'rgb(114,187,198)'
          }}
        >
          C
          <tspan x="487.225 562.597 636.565 704.778 775.003" y="2509">
            HURCH
          </tspan>
        </text>
      </g>
    </svg>
  );
}