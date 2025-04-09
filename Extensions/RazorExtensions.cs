namespace BlazorComponents.Extensions
{
    public static class RazorExtensions
    {
        public static T? If<T>(this bool val, T value, T? defaultValue = default)
            => val ? value : defaultValue;
        public static T? IfElse<T>(this bool val, T value, T valueElse)
            => val ? value : valueElse;
        public static T? Else<T>(this bool val, T value, T? defaultValue = default)
            => val ? defaultValue : value;

        public static T? IfNot<T>(this bool val, T value, T? defaultValue = default)
            => !val ? value : defaultValue;
        public static bool Invert(this bool value) => !value;

        public static string GetResourceUrl(this string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            if (text.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return text;
            while (text.StartsWith('/'))
            {
                text = text[1..];
            }
            return string.IsNullOrEmpty(text) ? text : $"https://s3.amazonaws.com/{text}";
        }
    }
}
