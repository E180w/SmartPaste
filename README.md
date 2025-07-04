# SmartPaste - Умная вставка кода для VS Code

**SmartPaste** автоматически адаптирует скопированный код под стиль вашего проекта. Больше никаких ручных исправлений отступов, переименования переменных или добавления импортов!

## 🌟 Что делает SmartPaste

- **Автоматически изменяет стиль кода**: Приводит отступы, именование переменных и кавычки к стилю вашего проекта
- **Добавляет импорты**: Автоматически добавляет необходимые import/require statements
- **Переименовывает переменные**: Конвертирует между camelCase, snake_case, PascalCase
- **Проверяет версии библиотек**: Предупреждает о конфликтах версий
- **Поддерживает языки**: Python, JavaScript, TypeScript

## 📦 Установка для пользователей

### Шаг 1: Установите Visual Studio Code

1. Перейдите на [code.visualstudio.com](https://code.visualstudio.com/)
2. Нажмите **"Download"** для вашей операционной системы
3. Запустите скачанный файл и следуйте инструкциям
4. Откройте VS Code

### Шаг 2: Установите расширение SmartPaste

1. Скачайте файл `smartpaste-1.0.0.vsix`
2. Откройте VS Code
3. Нажмите **Ctrl+Shift+P** (Windows/Linux) или **Cmd+Shift+P** (Mac)
4. Введите: **"Extensions: Install from VSIX"**
5. Выберите скачанный файл `.vsix`
6. Нажмите **"Install"**
7. Перезапустите VS Code

## 🛠️ Сборка из исходного кода (для разработчиков)

### Предварительные требования
1. **Установите Node.js 18+**: https://nodejs.org (выберите LTS версию)
2. **Проверьте установку**: откройте командную строку и введите `node --version`

### Шаги сборки
```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd SmartPaste

# 2. Установите зависимости
npm install

# 3. Проверьте код
npm run lint

# 4. Скомпилируйте TypeScript
npm run compile

# 5. Создайте .vsix пакет
npm run package
```

### Установка собранного расширения
1. Найдите созданный файл `smartpaste-1.0.0.vsix`
2. В VS Code: View → Command Palette → "Extensions: Install from VSIX"
3. Выберите файл .vsix

## 🚀 Как использовать

1. Откройте файл кода в VS Code (Python, JavaScript или TypeScript)
2. Скопируйте код из любого источника (**Ctrl+C**)
3. Поставьте курсор в место вставки
4. Используйте **Smart Paste**:
   - Нажмите **Ctrl+Shift+V** (Windows/Linux) или **Cmd+Shift+V** (Mac)
   - Или щелкните правой кнопкой → выберите **"Smart Paste"**

## 💡 Пример

**Скопированный код:**
```python
import numpy
def calculateSum(myArray):
    result = numpy.sum(myArray)
    return result
```

**После Smart Paste (если ваш проект использует snake_case):**
```python
import numpy as np  # Импорт оптимизирован

def calculate_sum(my_array):  # Переменные переименованы
    result = np.sum(my_array)
    return result
```

## 🔧 Устранение проблем

**SmartPaste не работает?**
- Убедитесь, что расширение установлено (перезапустите VS Code)
- Проверьте, что используете поддерживаемый язык (Python, JavaScript, TypeScript)

**Код вставляется неправильно?**
- Убедитесь, что в файле достаточно кода для анализа стиля (минимум 5-10 строк)
- При ошибке используйте обычную вставку **Ctrl+V**

## 📞 Поддержка

Если что-то не работает:
1. Попробуйте перезапустить VS Code
2. Используйте обычную вставку **Ctrl+V** как запасной вариант
3. Сообщите о проблеме на [GitHub](https://github.com/smartpaste-dev/smartpaste/issues)

---

**Наслаждайтесь умной вставкой кода! 🎉** 