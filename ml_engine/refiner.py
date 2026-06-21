import sys
import json

def safe_json(data):
    print(json.dumps(data, ensure_ascii=True))
    sys.exit(0)

def main():
    if len(sys.argv) < 5:
        safe_json({"error": "Usage: python refiner.py <sub_id> <selected_model> <track> <task_type>"})
        
    sub_id = sys.argv[1]
    selected_model = sys.argv[2]
    track = sys.argv[3]
    task_type = sys.argv[4]
    
    # Dummy hyperparameter tuning results
    safe_json({
        "success": True,
        "best_params": {
            "n_estimators": 200,
            "max_depth": 10,
            "learning_rate": 0.05
        },
        "metric_name": "accuracy",
        "baseline_metrics": {
            "accuracy": 0.85
        },
        "refined_metrics": {
            "accuracy": 0.89
        },
        "performance_improvement_pct": 4.7
    })

if __name__ == "__main__":
    main()
