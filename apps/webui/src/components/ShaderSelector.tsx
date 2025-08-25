import { useState } from "react";
import { motion } from "motion/react";
import { Tooltip } from "./ui/tooltip";
import { shaders } from "./util/shaders";
import { ShaderPreviewButton } from "./ShaderPreviewButton";

interface ShaderSelectorProps {
  selectedShader: number;
  onSelectShader: (id: number) => void;
}

export const ShaderSelector = ({ selectedShader, onSelectShader }: ShaderSelectorProps) => {
  const [hoveredShader, setHoveredShader] = useState<number | null>(null);

  return (
    <motion.div 
      className="flex flex-col gap-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {shaders.map((shader, index) => (
        <motion.div
          key={shader.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Tooltip content={shader.name} side="left">
            <div className={`transition-opacity duration-200 ${
              hoveredShader && hoveredShader !== shader.id ? 'opacity-40' : 'opacity-100'
            }`}>
              <ShaderPreviewButton
                shaderId={shader.id}
                isSelected={selectedShader === shader.id}
                onSelect={() => onSelectShader(shader.id)}
                onMouseEnter={() => setHoveredShader(shader.id)}
                onMouseLeave={() => setHoveredShader(null)}
              />
            </div>
          </Tooltip>
        </motion.div>
      ))}
    </motion.div>
  );
};