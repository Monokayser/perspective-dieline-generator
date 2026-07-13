export const createSamplePackageImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  const gradient = context.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, "#eef3f8");
  gradient.addColorStop(1, "#dbe5ef");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 800);

  context.fillStyle = "rgba(15, 23, 42, 0.12)";
  context.beginPath();
  context.ellipse(618, 685, 360, 52, -0.02, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#d9a66f";
  context.strokeStyle = "#4a2f1d";
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(305, 250);
  context.lineTo(690, 190);
  context.lineTo(695, 600);
  context.lineTo(310, 660);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#b87843";
  context.beginPath();
  context.moveTo(690, 190);
  context.lineTo(920, 315);
  context.lineTo(920, 655);
  context.lineTo(695, 600);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#edc18f";
  context.beginPath();
  context.moveTo(305, 250);
  context.lineTo(525, 120);
  context.lineTo(920, 315);
  context.lineTo(690, 190);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "700 58px Inter, Arial, sans-serif";
  context.fillText("SAMPLE", 382, 460);
  context.font = "500 26px Inter, Arial, sans-serif";
  context.fillText("80 × 120 × 35 mm", 382, 506);
  return canvas.toDataURL("image/png");
};

