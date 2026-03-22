class ChatsController < ApplicationController
  include ActionController::Live
  def index
  end

  def create
    set_streaming_headers
    sse = SSE.new(response.stream, event: "message")
    client = OpenAI::Client.new(
      access_token: Rails.application.credentials.gemini.api_key,
      uri_base: "https://generativelanguage.googleapis.com/v1beta/openai/"
    )

    begin
      stream_chat_response(client, sse)
    rescue => e
      Rails.logger.error "Streaming error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    ensure
      sse.close
    end
  end

  private
  def set_streaming_headers
    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Last-Modified"] = Time.now.httpdate
  end

  def stream_chat_response(client, sse)
    client.chat(
      parameters: {
        model: "gemini-2.5-flash",
        messages: [
          { role: "user", content: params[:prompt] }
        ],
        stream: proc do |chunk|
          Rails.logger.info "Chunk received: #{chunk.inspect}"
          content = chunk.dig("choices", 0, "delta", "content")
          sse.write({ message: content }) if content
        end
      }
    )
  end
end
