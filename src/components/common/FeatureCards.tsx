export default function FeatureCards() {
  const features = [
    {
      icon: "技",
      title: "技術面",
      description: "露出・ピント・ノイズなどの技術的評価"
    },
    {
      icon: "構", 
      title: "構図",
      description: "三分割法・対称性・視線誘導の分析"
    },
    {
      icon: "色",
      title: "色彩", 
      description: "色調・彩度・コントラストの評価"
    }
  ]

  return (
    <div className="mt-12 grid md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <div key={index} className="text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 shadow-sm">
            <span className="text-gray-700 font-bold">{feature.icon}</span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}