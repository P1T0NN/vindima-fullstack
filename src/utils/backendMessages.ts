/**
 * Backend outcome messages — the ONLY key→text mapping in the app.
 *
 * Convex returns `message: { key, params? }` envelopes (never display text); this map renders
 * them to Spanish on the client. Unknown keys fall back to the key literal (visible in dev —
 * by design).
 */
export const BACKEND_MESSAGES: Record<string, string> = {
	'GenericMessages.PASSWORD_TOO_SHORT': 'La contraseña debe tener al menos {min} caracteres.',
	'GenericMessages.PASSWORD_TOO_LONG': 'La contraseña es demasiado larga.',
	'GenericMessages.PASSWORD_TOO_COMMON': 'Esa contraseña es demasiado común. Elige una más segura.',
	'GenericMessages.NO_ITEMS_PROVIDED': 'No se proporcionaron elementos.',
	'GenericMessages.NO_MATCHING_ITEMS': 'No se encontraron elementos coincidentes.',
	'GenericMessages.DATA_TABLE_DELETED_ALL': 'Se eliminaron {count} elemento(s).',
	'GenericMessages.DATA_TABLE_DELETED_WITH_MISSING':
		'Se eliminaron {count} elemento(s); {missing} ya no existían.',
	'GenericMessages.STORAGE_DELETE_FAILED':
		'No se pudo eliminar el archivo del almacenamiento. No se eliminó nada.',
	'GenericMessages.STORAGE_URL_UNAVAILABLE': 'No se pudo obtener la URL del archivo.',
	'GenericMessages.UPLOAD_SAVE_FAILED': 'No se pudo guardar el archivo subido. Inténtalo de nuevo.',
	'GenericMessages.UPLOAD_URL_READY': 'URL de subida generada.',
	'GenericMessages.EMAIL_SENT_SUCCESSFULLY': 'Correo enviado correctamente.',
	'GenericMessages.TEST_ROW_CREATED': 'Fila de prueba creada.',
	'GenericMessages.OK': 'Listo.',
	'GenericMessages.YOU_NEED_TO_CORRECT_FORM_ERRORS': 'Corrige los errores del formulario',
	'GenericMessages.BATCH_TOO_LARGE': 'Demasiados elementos en una sola solicitud (máx. {limit}).',
	'GenericMessages.FORBIDDEN': 'No tienes permiso para realizar esta acción.',
	'GenericMessages.NOT_AUTHENTICATED': 'Inicia sesión para continuar.',
	'GenericMessages.ADMIN_ACCESS_REQUIRED': 'Esta acción requiere privilegios de administrador.',
	'GenericMessages.ADMIN_CANNOT_BE_DELETED':
		'Los administradores no se pueden eliminar. Primero cámbialos a "user".',
	'GenericMessages.USER_NOT_FOUND': 'Usuario no encontrado.',
	'GenericMessages.USER_DELETED': 'Usuario eliminado.',
	'GenericMessages.USER_BANNED': 'Usuario bloqueado.',
	'GenericMessages.USER_UNBANNED': 'Usuario desbloqueado.',
	'GenericMessages.USER_ROLE_UPDATED': 'Rol de usuario actualizado.',
	'GenericMessages.SESSION_REVOKED': 'Sesión revocada.',
	'GenericMessages.ALL_SESSIONS_REVOKED': 'Todas las sesiones fueron revocadas.',
	'GenericMessages.TOO_MANY_REQUESTS': 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
	'GenericMessages.TOO_MANY_REQUESTS_SECONDS':
		'Demasiadas solicitudes. Inténtalo de nuevo en {seconds}s.',
	'GenericMessages.TOO_MANY_REQUESTS_MINUTES':
		'Demasiadas solicitudes. Inténtalo de nuevo en {minutes} min.',
	'GenericMessages.UNEXPECTED_ERROR': 'Ocurrió un error inesperado. Inténtalo de nuevo.',
	'RewardMessages.REWARDS_DISABLED': 'Las recompensas no están disponibles por ahora.',
	'RewardMessages.ITEM_NOT_ELIGIBLE': 'Ese artículo no está disponible como recompensa.',
	'RewardMessages.NO_REWARDS_AVAILABLE': 'Aún no tienes un artículo gratis para reclamar.',
	'RewardMessages.ACTIVE_CLAIM_EXISTS': 'Ya tienes un artículo gratis reservado.',
	'RewardMessages.REWARD_CLAIMED': 'Artículo gratis reservado: ¡va en tu próximo pedido!',
	'RewardMessages.CLAIM_CANCELLED': 'Recompensa devuelta a tu saldo.',
	'RewardMessages.CLAIM_NOT_FOUND': 'No encontramos esa reclamación de recompensa.',
	'RewardMessages.CLAIM_NOT_CANCELLABLE': 'Esa recompensa ya no se puede cambiar.',
	'RewardMessages.REWARD_ADJUSTED': 'Saldo de recompensas ajustado.',
	'RewardMessages.ACCOUNT_REBUILT': 'Cuenta de recompensas recalculada a partir del historial.',
	'RewardMessages.NOTHING_TO_ADJUST': 'Primero indica un cambio de sellos o recompensas.',
	'RewardMessages.ADJUST_NOT_INTEGER': 'Los ajustes deben ser números enteros.',
	'RewardMessages.CLAIM_NOT_ACTIVE': 'Esa reclamación de recompensa ya no está activa.',
	'RewardMessages.REWARD_ITEM_ADDED': 'Agregado a los artículos de recompensa.',
	'RewardMessages.REWARD_ITEM_REMOVED': 'Eliminado de los artículos de recompensa.',
	'RewardMessages.REWARD_ITEM_NOT_AVAILABLE':
		'Este artículo no está a la venta por ahora; primero hazlo disponible.',
	'ProductMessages.PRODUCT_CREATED': 'Producto creado.',
	'ProductMessages.PRODUCT_UPDATED': 'Producto actualizado.',
	'ProductMessages.PRODUCT_ARCHIVED': 'Producto archivado.',
	'ProductMessages.PRODUCT_RESTORED': 'Producto publicado.',
	'ProductMessages.PRODUCT_DELETED': 'Producto eliminado.',
	'ProductMessages.SLUG_TAKEN': 'Ese slug ya está en uso.',
	'ProductMessages.REF_TAKEN': 'Esa referencia de variante ya está en uso.',
	'ProductMessages.PRODUCT_NOT_FOUND': 'No encontramos ese producto.',
	'ProductMessages.VARIANT_NOT_FOUND': 'No encontramos esa variante.',
	'ProductMessages.PRODUCT_NOT_DRAFT':
		'Este producto ha estado activo, así que solo se puede archivar, no eliminar.',
	'ProductMessages.VARIANT_REQUIRED': 'Un producto necesita al menos una variante.',
	'ProductMessages.NAME_REQUIRED': 'Se requiere un nombre de producto.',
	'ProductMessages.IMAGE_REQUIRED': 'Un producto necesita al menos una imagen.',
	'ProductMessages.INVALID_PRICE':
		'El precio debe ser un número entero de centavos (sin negativos).',
	'ProductMessages.TOO_MANY_REFS': 'Se solicitaron demasiados elementos.',
	'ProductMessages.CATEGORY_CREATED': 'Categoría creada.',
	'ProductMessages.CATEGORY_RENAMED': 'Categoría renombrada.',
	'ProductMessages.CATEGORY_UPDATED': 'Categoría actualizada.',
	'ProductMessages.CATEGORY_DELETED': 'Categoría eliminada.',
	'ProductMessages.CATEGORY_TAKEN': 'Esa categoría ya existe.',
	'ProductMessages.CATEGORY_NOT_FOUND': 'No encontramos esa categoría.',
	'ProductMessages.CATEGORY_NAME_REQUIRED': 'Se requiere un nombre de categoría.',
	'ProductMessages.CATEGORY_IMAGE_INVALID':
		'No se pudo guardar la imagen de la categoría. Vuelve a subirla.',
	'ProductMessages.CATEGORY_IN_USE':
		'Esta categoría todavía tiene productos. Muévelos o elimínalos primero.',
	'ProductMessages.CATEGORY_INVALID': 'Esa categoría no existe. Elige una de la lista.',
	'ProductMessages.LAST_VARIANT':
		'No se puede eliminar la última variante: un producto necesita al menos una.',
	'ProductMessages.VARIANT_REWARD_ELIGIBLE':
		'Esta variante es un artículo de recompensa. Primero elimínala de la lista de recompensas.',
	'ProductMessages.VARIANT_HAS_ACTIVE_CLAIM':
		'Un cliente tiene esta variante reservada como recompensa. Inténtalo de nuevo cuando su reclamación se use o se cancele.',
	'CartMessages.CART_FULL': 'Tu carrito está lleno. Quita un artículo antes de agregar otro.',
	'CheckoutMessages.CHECKOUT_DISABLED': 'El proceso de compra no está disponible por el momento.',
	'CheckoutMessages.AUTH_REQUIRED': 'Inicia sesión para realizar tu pedido.',
	'CheckoutMessages.EMPTY_ORDER': 'Tu carrito está vacío.',
	'CheckoutMessages.UNAVAILABLE_LINES':
		'Algunos artículos ya no están disponibles. Revisa tu pedido.',
	'CheckoutMessages.INVALID_DELIVERY': 'Esa opción de entrega no está disponible.',
	'CheckoutMessages.INVALID_PAYMENT_METHOD': 'Ese método de pago no está disponible.',
	'CheckoutMessages.ORDER_PLACED': 'Pedido realizado.',
	'CheckoutMessages.ORDER_NOT_FOUND': 'No encontramos ese pedido.',
	'CheckoutMessages.ORDER_NOT_PENDING': 'Este pedido ya no se puede modificar.',
	'CheckoutMessages.NOT_YOUR_ORDER': 'Este pedido no es tuyo.',
	'CheckoutMessages.ORDER_CANCELLED': 'Pedido cancelado.',
	'CheckoutMessages.ORDER_NOT_PAID': 'Esta acción solo aplica a pedidos pagados.',
	'CheckoutMessages.ORDER_REFUNDED': 'Pedido reembolsado.',
	'CheckoutMessages.ORDER_MARKED_PAID': 'Pedido marcado como pagado.',
	'CheckoutMessages.ORDER_FULFILLMENT_UPDATED': 'Estado de entrega actualizado.',

	// Upsells (add-to-cart suggestions) — UpsellsSystemDesign.md §11
	'UpsellsMessages.RULE_CREATED': 'Sugerencia creada.',
	'UpsellsMessages.RULE_UPDATED': 'Sugerencia actualizada.',
	'UpsellsMessages.RULE_DELETED': 'Sugerencia eliminada.',
	'UpsellsMessages.RULE_TOGGLED': 'Sugerencia actualizada.',
	'UpsellsMessages.RULE_EXISTS': 'Ya existe una sugerencia para este disparador.',
	'UpsellsMessages.RULE_NOT_FOUND': 'No encontramos esa sugerencia.',
	'UpsellsMessages.INVALID_TRIGGER': 'Ese disparador ya no está disponible.',
	'UpsellsMessages.INVALID_ITEMS': 'Revisa los artículos sugeridos: algunos ya no están disponibles.',
	'UpsellsMessages.UPSELLS_DISABLED': 'Las sugerencias no están disponibles por el momento.'
};
