import { query } from './db.js';
import { Logger } from './logger.js';

/**
 * Log employee activity
 * @param {Object} params
 * @param {string} params.employeeId - Employee ID
 * @param {string} params.actionType - Type of action (document_generated, transfer, etc.)
 * @param {string} params.actionCategory - Category (document, transfer, status)
 * @param {string} params.title - Short title
 * @param {string} params.description - Detailed description
 * @param {Object} [params.metadata] - Additional data
 * @param {string} [params.performedById] - Who performed the action
 * @param {string} [params.performedByName] - Name of who performed
 */
export async function logActivity({
    employeeId,
    actionType,
    actionCategory,
    title,
    description,
    metadata = {},
    performedById,
    performedByName
}) {
    try {
        await query(`
            INSERT INTO employee_activity_logs 
            (employee_id, action_type, action_category, title, description, 
             metadata, performed_by_id, performed_by_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [employeeId, actionType, actionCategory, title, description, 
            JSON.stringify(metadata), performedById, performedByName]);
        
        Logger.info(`[Activity] ${actionType}: ${title} for employee ${employeeId}`);
    } catch (err) {
        Logger.error('[Activity Logger] Failed to log activity:', err.message);
        // Don't throw - logging failure shouldn't break the main operation
    }
}

/**
 * Log document generation
 */
export async function logDocumentGenerated(employeeId, docType, docId, performedBy) {
    const docLabels = {
        contract: 'Трудовой договор',
        order_hiring: 'Приказ о приеме',
        application: 'Заявление на прием',
        vacation_application: 'Заявление на отпуск',
        vacation_order: 'Приказ на отпуск',
        termination_order: 'Приказ об увольнении',
        employment_certificate: 'Справка с места работы'
    };
    
    await logActivity({
        employeeId,
        actionType: 'document_generated',
        actionCategory: 'document',
        title: `Сформирован документ: ${docLabels[docType] || docType}`,
        description: docLabels[docType] || docType,
        metadata: { document_type: docType, document_id: docId },
        performedById: performedBy?.id,
        performedByName: performedBy?.name || 'HR'
    });
}

/**
 * Log employee transfer
 */
export async function logTransfer(employeeId, fromPvz, toPvz, performedBy) {
    await logActivity({
        employeeId,
        actionType: 'transfer',
        actionCategory: 'transfer',
        title: 'Перевод на другой ПВЗ',
        description: `${fromPvz?.name || 'Не указан'} → ${toPvz?.name || 'Не указан'}`,
        metadata: { 
            from_pvz_id: fromPvz?.id, 
            from_pvz_name: fromPvz?.name,
            to_pvz_id: toPvz?.id, 
            to_pvz_name: toPvz?.name 
        },
        performedById: performedBy?.id,
        performedByName: performedBy?.name || 'HR'
    });
}

/**
 * Log status change
 */
export async function logStatusChange(employeeId, oldStatus, newStatus, performedBy) {
    const statusLabels = {
        new: 'Новый',
        review: 'На рассмотрении',
        revision: 'Доработка',
        signing: 'Подписание',
        active: 'Активный',
        fired: 'Уволен'
    };
    
    await logActivity({
        employeeId,
        actionType: 'status_changed',
        actionCategory: 'status',
        title: `Изменение статуса`,
        description: `${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`,
        metadata: { old_status: oldStatus, new_status: newStatus },
        performedById: performedBy?.id,
        performedByName: performedBy?.name || 'HR'
    });
}

/**
 * Log hiring
 */
export async function logHired(employeeId, pvzName, performedBy) {
    await logActivity({
        employeeId,
        actionType: 'hired',
        actionCategory: 'status',
        title: 'Принят на работу',
        description: pvzName ? `ПВЗ: ${pvzName}` : 'Сотрудник',
        metadata: { pvz_name: pvzName },
        performedById: performedBy?.id,
        performedByName: performedBy?.name || 'HR'
    });
}
