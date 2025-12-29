// 队员数据库 - 可根据实际情况扩展
const membersData = {
    // 示例队员数据
    "3025123456": {
        name: "张三",
        class: "计算机学院2023级",
        position: "护旗手",
        joinDate: "2023年9月",
        achievements: [
            "全勤参与本学期训练",
            "考核成绩优秀",
            "担任第三小组组长"
        ],
        trainingHours: 45,
        attendance: "100%",
        // 个人训练图片配置
        photos: {
            // 训练阶段对应的照片数量
            "meeting": 3,           // 见面会
            "night-training": 2,    // 晚训
            "big-training": 15,     // 大训练
            "exam": 5,              // 考核
            "team-building": 4      // 素质拓展
        }
    },
    "2023123457": {
        name: "李四",
        class: "电子信息学院2023级",
        position: "预备队员",
        joinDate: "2023年9月",
        achievements: [
            "训练进步最快队员",
            "积极参与队内活动",
            "协助器材管理"
        ],
        trainingHours: 42,
        attendance: "93%",
        photos: {
            "meeting": 2,
            "night-training": 3,
            "big-training": 12,
            "exam": 4,
            "team-building": 3
        }
    },
    // 可以继续添加更多队员数据...
    // 建议：使用Excel整理后，通过脚本批量生成这个文件
};

// 导出数据供其他文件使用
if (typeof module !== 'undefined') {
    module.exports = membersData;
}