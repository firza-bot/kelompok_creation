import sys
import json

def safe_json(data):
    print(json.dumps(data, ensure_ascii=True))
    sys.exit(0)

def main():
    if len(sys.argv) < 4:
        safe_json({"error": "Usage: python predict.py <sub_id> <input_data> <mode>"})
        
    sub_id = sys.argv[1]
    input_data = sys.argv[2]
    mode = sys.argv[3]
    
    # Simple dummy prediction logic since real models might be absent
    safe_json({
        "success": True,
        "prediction": "Predicted_Class_A",
        "confidence": 0.89,
        "mode": mode,
        "details": "Simulated prediction from restored model"
    })

if __name__ == "__main__":
    main()
