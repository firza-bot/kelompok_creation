import sys
import json

def safe_json(data):
    print(json.dumps(data, ensure_ascii=True))
    sys.exit(0)

def main():
    if len(sys.argv) < 3:
        safe_json({"error": "Usage: python report_generator.py <temp_json_path> <stage>"})
    
    json_path = sys.argv[1]
    stage = sys.argv[2]
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        safe_json({"error": f"Failed to load json data: {str(e)}"})
        
    if str(stage) == "6":
        track = data.get("stage_0", {}).get("track", "tabular")
        task_type = data.get("stage_0", {}).get("task_type", "classification")
        selected_model = data.get("stage_3", {}).get("selected_model", "Model Terpilih")
        acc = data.get("stage_5", {}).get("refined_metrics", {}).get("accuracy", 0.0)
        
        safe_json({
            "success": True,
            "technical_report": {
                "pipeline_summary": {
                    "track": track,
                    "task_type": task_type,
                    "selected_model": selected_model,
                },
                "performance_comparison": {
                    "refined_metrics": {
                        "accuracy": acc
                    }
                }
            }
        })
    else:
        acc = data.get("stage_5", {}).get("refined_metrics", {}).get("accuracy", 0.0)
        safe_json({
            "success": True,
            "management_report": {
                "summary": f"Sistem cerdas berhasil melatih model dengan tingkat akurasi akhir sebesar {acc*100:.1f}%. Model ini siap diintegrasikan untuk pengambilan keputusan bisnis.",
                "recommendations": [
                    "Gunakan model ini di sistem produksi untuk memilah data secara otomatis.",
                    "Lakukan pemantauan berkala (model monitoring) jika ada pergeseran distribusi data.",
                    "Latih ulang model dengan data baru secara berkala."
                ]
            }
        })

if __name__ == "__main__":
    main()
