/**
 * 数据处理工具 - 用于处理训练记录和生成统计数据
 */
class DataProcessor {
    constructor() {
        this.records = window.trainingRecords || {};
        this.photos = window.photosMetadata || {};
        this.achievements = window.achievementsData || {};
    }
    
    /**
     * 获取队员的训练数据
     */
    getTrainingData(studentId) {
        const record = this.records[studentId];
        if (!record) return null;
        
        // 计算更多统计数据
        const stats = this.calculateAdvancedStats(record);
        
        return {
            ...record,
            statistics: {
                ...record.statistics,
                ...stats
            }
        };
    }
    
    /**
     * 计算高级统计数据
     */
    calculateAdvancedStats(record) {
        const weeklyHours = record.weeklyHours || [];
        const milestones = record.milestones || [];
        
        return {
            // 训练趋势分析
            trend: this.analyzeTrend(weeklyHours),
            
            // 里程碑统计
            totalMilestones: milestones.length,
            trainingMilestones: milestones.filter(m => m.type === 'training').length,
            examMilestones: milestones.filter(m => m.type === 'exam').length,
            eventMilestones: milestones.filter(m => m.type === 'event').length,
            
            // 训练分布
            morningTrainings: 0, // 可以从详细记录中计算
            eveningTrainings: 0,
            weekendTrainings: 0
        };
    }
    
    /**
     * 分析训练趋势
     */
    analyzeTrend(weeklyHours) {
        if (weeklyHours.length < 2) return 'stable';
        
        const firstHalfAvg = this.calculateAverage(weeklyHours.slice(0, weeklyHours.length / 2));
        const secondHalfAvg = this.calculateAverage(weeklyHours.slice(weeklyHours.length / 2));
        
        if (secondHalfAvg > firstHalfAvg * 1.2) return 'improving';
        if (secondHalfAvg < firstHalfAvg * 0.8) return 'declining';
        return 'stable';
    }
    
    /**
     * 计算平均值
     */
    calculateAverage(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    
    /**
     * 获取队员的照片数据
     */
    getPhotos(studentId) {
        return this.photos[studentId] || [];
    }
    
    /**
     * 获取队员的成就数据
     */
    getAchievements(studentId) {
        const common = this.achievements.commonAchievements || [];
        const memberIds = this.achievements.memberAchievements?.[studentId] || [];
        
        return common.filter(achievement => 
            memberIds.includes(achievement.id)
        );
    }
    
    /**
     * 生成训练报告
     */
    generateTrainingReport(studentId, memberData) {
        const trainingData = this.getTrainingData(studentId);
        if (!trainingData) return null;
        
        const stats = trainingData.statistics;
        const milestones = trainingData.milestones || [];
        
        return {
            summary: this.generateSummary(stats, milestones),
            highlights: this.extractHighlights(milestones),
            recommendations: this.generateRecommendations(stats)
        };
    }
    
    /**
     * 生成训练总结
     */
    generateSummary(stats, milestones) {
        return `
            在过去的一学期中，您共参加了${stats.totalTrainings}次训练，
            累计训练时长${stats.totalHours}小时，平均每周训练${stats.averageWeeklyHours.toFixed(1)}小时。
            您的出勤率达到${stats.attendanceRate}%，展现了极高的训练热情和责任感。
            经历了${milestones.length}个重要训练节点，包括${stats.examMilestones}次考核和${stats.eventMilestones}次重要活动。
        `;
    }
    
    /**
     * 提取训练亮点
     */
    extractHighlights(milestones) {
        return milestones
            .filter(m => m.significance && m.significance.includes('首次'))
            .map(m => ({
                date: m.date,
                event: m.event,
                description: m.description
            }));
    }
    
    /**
     * 生成训练建议
     */
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.attendanceRate < 90) {
            recommendations.push("建议提高出勤率，保持训练连续性");
        }
        
        if (stats.averageWeeklyHours < 4) {
            recommendations.push("建议适当增加每周训练时长，保持训练强度");
        }
        
        if (stats.trend === 'declining') {
            recommendations.push("近期训练时长有所下降，建议调整训练计划");
        }
        
        return recommendations.length > 0 
            ? recommendations 
            : ["继续保持当前的训练状态，持续进步"];
    }
    
    /**
     * 批量处理Excel数据
     * @param {Array} excelData - 从Excel导出的数据
     */
    processExcelData(excelData) {
        const processed = {};
        
        excelData.forEach(row => {
            const studentId = row.学号;
            
            if (!processed[studentId]) {
                processed[studentId] = {
                    weeklyHours: [],
                    milestones: [],
                    statistics: {
                        totalHours: 0,
                        totalTrainings: 0,
                        attendances: 0
                    }
                };
            }
            
            // 处理每周数据
            if (row.训练日期 && row.训练时长) {
                processed[studentId].weeklyHours.push(parseFloat(row.训练时长));
                processed[studentId].statistics.totalTrainings++;
                processed[studentId].statistics.totalHours += parseFloat(row.训练时长);
                
                if (row.出勤状态 === '出勤') {
                    processed[studentId].statistics.attendances++;
                }
            }
            
            // 处理里程碑事件
            if (row.事件类型 && row.事件类型 !== '常规训练') {
                processed[studentId].milestones.push({
                    date: row.日期,
                    event: row.事件类型,
                    type: this.mapEventType(row.事件类型),
                    description: row.事件描述 || '',
                    significance: row.重要性 || ''
                });
            }
        });
        
        // 计算最终统计数据
        Object.keys(processed).forEach(studentId => {
            const data = processed[studentId];
            const weeklyHours = data.weeklyHours;
            
            data.statistics.averageWeeklyHours = weeklyHours.length > 0 
                ? weeklyHours.reduce((a, b) => a + b, 0) / weeklyHours.length 
                : 0;
            
            data.statistics.maxWeeklyHours = weeklyHours.length > 0 
                ? Math.max(...weeklyHours) 
                : 0;
            
            data.statistics.attendanceRate = data.statistics.totalTrainings > 0 
                ? ((data.statistics.attendances / data.statistics.totalTrainings) * 100).toFixed(1)
                : 0;
        });
        
        return processed;
    }
    
    /**
     * 映射事件类型
     */
    mapEventType(eventName) {
        const mapping = {
            '晚训': 'training',
            '大训练': 'training',
            '队列考核': 'exam',
            '升旗考核': 'exam',
            '入队仪式': 'event',
            '表演活动': 'event',
            '颁奖': 'award'
        };
        
        return mapping[eventName] || 'training';
    }
}